"""
Connector Registry — discovers and loads all connector plugins automatically.
Phase 14 & 15: Discovers static plugins and generates 200+ dynamic connectors from portals_catalog.json.
"""
from __future__ import annotations
import importlib
import inspect
import pkgutil
import os
import json
from typing import Dict, Type

import structlog

from app.connectors.base import BaseConnector

logger = structlog.get_logger()

# Explicit registry
_CONNECTOR_CLASSES: Dict[str, Type[BaseConnector]] = {}

# All plugin packages to scan (root + subdirs)
_PLUGIN_PACKAGES = [
    "app.connectors.plugins",
    "app.connectors.plugins.central_gov",
    "app.connectors.plugins.state",
]


def _register(connector_class: Type[BaseConnector]):
    _CONNECTOR_CLASSES[connector_class.source_id] = connector_class


def _auto_discover():
    """Auto-register all connectors in all plugin packages."""
    for pkg_name in _PLUGIN_PACKAGES:
        try:
            pkg = importlib.import_module(pkg_name)
        except ImportError as e:
            logger.warning("Plugin package not importable", package=pkg_name, error=str(e))
            continue

        if not hasattr(pkg, "__path__"):
            continue

        for importer, modname, ispkg in pkgutil.iter_modules(pkg.__path__):
            if ispkg:
                continue
            full_modname = f"{pkg_name}.{modname}"
            try:
                module = importlib.import_module(full_modname)
            except Exception as e:
                logger.error("Failed to import connector module", module=full_modname, error=str(e))
                continue

            for name, obj in inspect.getmembers(module, inspect.isclass):
                if (
                    issubclass(obj, BaseConnector)
                    and obj is not BaseConnector
                    and hasattr(obj, "source_id")
                    and isinstance(obj.source_id, str)
                    and obj.source_id  # non-empty
                ):
                    try:
                        _ = obj.source_id
                    except AttributeError:
                        continue
                    _register(obj)
                    logger.info("Registered connector", source_id=obj.source_id,
                                class_name=name, package=pkg_name)

    # Now load catalog-based dynamic connectors to expand coverage to 200+ portals
    try:
        from app.connectors.plugins.state.state_base import StateBaseConnector
        
        catalog_path = os.path.join(os.path.dirname(__file__), "portals_catalog.json")
        if os.path.exists(catalog_path):
            with open(catalog_path, "r") as f:
                portals = json.load(f)
            
            for p in portals:
                sid = p["source_id"]
                # Skip if already registered statically
                if sid in _CONNECTOR_CLASSES:
                    continue
                
                # Dynamic subclass generation
                class_name = "".join(word.capitalize() for word in sid.split("_")) + "Connector"
                dyn_class = type(
                    class_name,
                    (StateBaseConnector,),
                    {
                        "source_id": sid,
                        "display_name": p["display_name"],
                        "description": f"Dynamic connector for {p['display_name']}",
                        "STATE_NAME": p.get("state", "Delhi"),
                        "PORTAL_URL": p["url"],
                        "PORTAL_DOMAIN": p["domain"],
                        "PORTAL_TYPE": p.get("type", "state"),
                    }
                )
                _register(dyn_class)
                logger.info("Registered dynamic catalog connector", source_id=sid, class_name=class_name)
    except Exception as e:
        logger.error("Failed to load dynamic portals catalog", error=str(e))


_auto_discover()


def get_connector(source_id: str, config: dict = None) -> BaseConnector:
    cls = _CONNECTOR_CLASSES.get(source_id)
    if not cls:
        raise ValueError(f"No connector registered for source_id: {source_id}")
    return cls(config=config)


def list_connectors() -> Dict[str, dict]:
    return {
        sid: {
            "source_id": sid,
            "display_name": cls.display_name,
            "description": cls.description,
            "cadence": cls.cadence.cron,
            "access_limitations": getattr(cls, "access_limitations", ""),
        }
        for sid, cls in _CONNECTOR_CLASSES.items()
    }


def get_all_source_ids() -> list:
    return list(_CONNECTOR_CLASSES.keys())
