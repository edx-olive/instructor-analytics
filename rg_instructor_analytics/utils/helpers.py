from openedx.core.djangoapps.site_configuration.models import SiteConfiguration


SGA_SITES = 'sga_sites'


def get_all_orgs_by_selected_sites(selected_sites):
    _selected_sites = []

    if selected_sites:
        if selected_sites == SGA_SITES:
            _selected_sites = list(SiteConfiguration.objects.filter(
                values__contains='"SGA_SITE":true'
            ).values_list(
                'site_id', flat=True
            ))
        elif not isinstance(selected_sites, list):
            _selected_sites.append(selected_sites)
        else:
            _selected_sites = selected_sites

        return map(str, SiteConfiguration.get_all_orgs(_selected_sites))
