"""
Connector Registry — discovers and loads all connector plugins automatically.
Adding a new connector: create a file in plugins/ implementing BaseConnector.
No changes to core code required.
"""
from __future__ import annotations
import importlib
import inspect
import pkgutil
from typing import Dict, Type

import structlog

from app.connectors.base import BaseConnector
# Plugins are auto-discovered dynamically at runtime


logger = structlog.get_logger()

# Explicit registry — in production can be auto-discovered
_CONNECTOR_CLASSES: Dict[str, Type[BaseConnector]] = {}


def _register(connector_class: Type[BaseConnector]):
    _CONNECTOR_CLASSES[connector_class.source_id] = connector_class


def _auto_discover():
    """Auto-register all connectors in plugins package."""
    import app.connectors.plugins as plugins_pkg
    for importer, modname, ispkg in pkgutil.iter_modules(plugins_pkg.__path__):
        module = importlib.import_module(f"app.connectors.plugins.{modname}")
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if (
                issubclass(obj, BaseConnector)
                and obj is not BaseConnector
                and hasattr(obj, "source_id")
            ):
                _register(obj)
                logger.info("Registered connector", source_id=obj.source_id, class_name=name)


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
        }
        for sid, cls in _CONNECTOR_CLASSES.items()
    }
