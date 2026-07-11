"""
Connector Registry — discovers and loads all connector plugins automatically.

Phase 14: Extended to discover connectors in subdirectory packages
(plugins/central_gov/, plugins/state/) in addition to the root plugins/ dir.

Adding a new connector: create a file in any plugins/ subdirectory implementing
BaseConnector with source_id set. No changes to core code required.
"""
from __future__ import annotations
import importlib
import inspect
import pkgutil
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
                continue  # Don't recurse into sub-packages at this level
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
                    # Skip abstract intermediate bases (no source_id set at class level)
                    try:
                        _ = obj.source_id
                    except AttributeError:
                        continue
                    _register(obj)
                    logger.info("Registered connector", source_id=obj.source_id,
                                class_name=name, package=pkg_name)


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
