# -*- coding: utf-8 -*-
# Generated by Django 1.11.15 on 2019-12-09 11:57
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('rg_instructor_analytics', '0007_instructortabsconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='lastgradestatupdate',
            name='force_update_students',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL),
        ),
    ]
