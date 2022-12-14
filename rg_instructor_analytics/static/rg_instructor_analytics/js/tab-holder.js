function TabHolder(tabs, course, coursesSwitch) {
    var holder = this;

    this.tabs = tabs;
    this.course = course;

    this.original_ajax = $.ajax;

    $.ajax = function() {
        if(arguments[0].data === undefined){
            arguments[0].data = {};
        }
        arguments[0].data.course_id = holder.course;
        return  holder.original_ajax.apply(holder.original_ajax, arguments);
    };

    function setTab(tabName) {
        var tab = tabs[tabName];
        tab.tabHolder = holder;
        tab.button.click(function () {
            holder.toggleToTab(tabName);
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
            }

            // FIXME: temp dirty hack for React tabs:
            if (tab === 'add-info') {
                coursesSwitch.parent().hide()
            } else {
                if (tabName === tab) {
                    coursesSwitch.off('change');
                    coursesSwitch = $('.active-section').find('#select_course');
                    coursesSwitch.val(this.course).change();
                    coursesSwitch.change(function(item) {
                        holder.selectCourse(item.target.value);
                    });
                }
                coursesSwitch.parent().show()
            }
        }
    };

    this.openLocation = function(location) {
        var tab = tabs[location.value];

        if (tab.openLocation) {
            tab.openLocation(location.child);
        }
        this.toggleToTab(location.value);
    };

    this.selectCourse = function(course) {
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
