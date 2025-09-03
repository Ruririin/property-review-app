class DatabaseRouter:
    """
    A router to control all database operations on models
    """
    
    route_app_labels = {
        'property_review': 'default',
        'authentication': 'default',
        'forms_data': 'forms_db',  # New app for form data
    }

    def db_for_read(self, model, **hints):
        """Suggest the database to read from."""
        if model._meta.app_label in self.route_app_labels:
            return self.route_app_labels[model._meta.app_label]
        return None

    def db_for_write(self, model, **hints):
        """Suggest the database to write to."""
        if model._meta.app_label in self.route_app_labels:
            return self.route_app_labels[model._meta.app_label]
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if the models are in the same app."""
        db_set = {'default', 'forms_db'}
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that certain apps' models get created on the right database."""
        if app_label in self.route_app_labels:
            return db == self.route_app_labels[app_label]
        elif db == 'forms_db':
            return False
        return db == 'default'