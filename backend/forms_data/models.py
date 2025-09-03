from django.db import models

class FormData(models.Model):
    """
    Model for form application data from db_neitclem_app table: tbl_lro
    Maps to the property review text fields:
    - appName -> insuredName
    - locationA, locationB, locationC -> premiseLocation  
    - descOper -> description and isoClass
    - webAdd -> website
    """
    # Primary key
    id = models.AutoField(primary_key=True)
    
    # Main fields for property review mapping
    appName = models.CharField(max_length=255, blank=True, null=True)  # Applicant name -> insuredName
    locationA = models.CharField(max_length=255, blank=True, null=True)  # Location A -> premiseLocation
    locationB = models.CharField(max_length=255, blank=True, null=True)  # Location B -> premiseLocation
    locationC = models.CharField(max_length=255, blank=True, null=True)  # Location C -> premiseLocation
    descOper = models.TextField(blank=True, null=True)  # Description of operations -> description/isoClass
    webAdd = models.CharField(max_length=255, blank=True, null=True)  # Web address -> website
    ISO = models.CharField(max_length=255, blank=True, null=True)  # ISO codes and descriptions for Type of Operation
    
    # Additional useful fields
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    contactName = models.CharField(max_length=255, blank=True, null=True)
    agencyName = models.CharField(max_length=255, blank=True, null=True)
    control = models.CharField(max_length=50, blank=True, null=True)
    dateAdded = models.DateField()
    created_at = models.DateTimeField()

    class Meta:
        app_label = 'forms_data'
        db_table = 'tbl_lro'

    def __str__(self):
        return f"{self.applicant_name} - {self.locations}"
