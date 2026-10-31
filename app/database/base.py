try:
    from sqlalchemy.ext.declarative import declarative_base
    Base = declarative_base()
except ImportError:
    class Base:
        pass
