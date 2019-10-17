function TabHolder(tabs, course) {
    var holder = this,
        activeTab = null;

    this.tabs = tabs;
    this.course = course;

    this.original_ajax = $.ajax;

    $.ajax = function () {
        if (arguments[0].data === undefined) {
            arguments[0].data = {};
        }
        arguments[0].data.course_id = holder.course;
        return holder.original_ajax.apply(holder.original_ajax, arguments);
    };

    function setTab(tabName) {
        var tab = tabs[tabName];
        tab.tabHolder = holder;
        tab.button.click(function () {
            holder.toggleToTab(tabName);
            try {
                tab.onClickTitle();
            } catch (err) {
                if (!(err instanceof NotImplementedError)) {
                    throw err;
                }
            }

            if (activeTab != null && !_.isEqual(tab, activeTab)) {
                try {
                    activeTab.onExit();
                } catch (err) {
                    if (!(err instanceof NotImplementedError)) {
                        throw err;
                    }
                }
            }

            activeTab = tab;
        });
    }

    for (var tabName in tabs) {
        if (tabs.hasOwnProperty(tabName)) {
            setTab(tabName);
        }
    }

    this.toggleToTab = function (tab) {
        for (var tabName in tabs) {
            if (tabs.hasOwnProperty(tabName)) {
                tabs[tabName].setActive(tabName === tab);

                // Hide course selector for "General Metrics" tab and show for others.
                // FIXME: Dirty approach. TabHolder is generic class.
                //  It cannot depend on the implementation of child-classes. This needs to be fixed.
                if (tab === "insights") {
                    $("#select_course").hide();
                } else {
                    $("#select_course").show();
                }
            }
        }
    };

    this.openLocation = function (location) {
        var tab = tabs[location.value];

        if (tab.openLocation) {
            tab.openLocation(location.child);
        }
        this.toggleToTab(location.value);
    };

    this.selectCourse = function (course) {
        holder.course = course;
        for (var tabName in tabs) {
            if (tabs.hasOwnProperty(tabName)) {
                if (tabs[tabName].isActive) {
                    tabs[tabName].loadTabData();
                }
            }
        }
    }
}
