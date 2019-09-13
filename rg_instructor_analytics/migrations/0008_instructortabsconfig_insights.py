# -*- coding: utf-8 -*-
# Generated by Django 1.11.15 on 2019-09-07 13:31
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rg_instructor_analytics', '0007_instructortabsconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='instructortabsconfig',
            name='insights',
            field=models.BooleanField(default=True, verbose_name='General Metrics'),
        ),
    ]
