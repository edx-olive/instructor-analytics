# -*- coding: utf-8 -*-


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rg_instructor_analytics', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='enrollmentbystudent',
            name='student',
            field=models.IntegerField(),
        ),
    ]
