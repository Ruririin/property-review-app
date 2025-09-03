from django.urls import path
from . import views

urlpatterns = [
    path('forms/', views.FormDataListView.as_view(), name='form-data-list'),
    path('forms/<int:pk>/', views.FormDataDetailView.as_view(), name='form-data-detail'),
    path('forms/search/', views.search_form_data, name='form-data-search'),
    path('forms/for-property-review/', views.get_form_data_for_property_review, name='form-data-for-property-review'),
    
    # ISO data endpoints
    path('iso-codes/search/', views.search_iso_codes, name='iso-codes-search'),
    path('iso-codes/', views.get_all_iso_codes, name='iso-codes-all'),
]