/**
 * Created by omelchenko on 03.12.2014.
 */

function materialTableUpdateTabs(parent, response) {
    response = s(response.table);
    s('.sub-tab-content', parent).each(function (subTab) {
        subTab.html(s('#' + subTab.a('id'), response).html());
    });
    SamsonCMS_Input.update(parent);
}
function bindButtons(tab, response) {
    materialTableUpdateTabs(tab.parent(), response);
    updatePriorityOnChange(tab);
    initSortable(savePriority);
    reloadQuantityFields(tab);
    loader.hide();

    // Init selectify plugin
    s('.material-structure-selectify', tab).each(function(el){
        el.selectify();

        initLinks(el.prev());

        s('._sjsselect_dropdown li', el.prev()).each(function(li) {
            if (!li.hasClass('selectify-loaded')) {
                li.click(function(li) {
                    s.ajax(el.a('data-href-add') + '/' + li.a('value'), function(response) {
                        initLinks(el.prev());
                    });
                    li.addClass('selectify-loaded');
                });
            }
        });

        function initLinks(block) {
            s('._sjsselect ._sjsselect_delete', block).each(function(link) {
                if (!link.hasClass('selectify-loaded')) {
                    link.click(function(link) {
                        s.ajax(select.a('data-href-remove') + '/' + link.a('value'), function(response) {
                        });
                        link.addClass('selectify-loaded');
                    });
                }
            });
        }
    });

}

function initMaterialTable(tab) {
    s('.delete_table_material', tab).ajaxClick(function (response) {
        bindButtons(tab, response);
    }, function () {
        loader.show('', true);
        return true;
    });
    s('.material_table_add', tab).ajaxClick(function (response) {
        bindButtons(tab, response);
    }, function () {
        loader.show('', true);
        return true;
    });
    s('.copy_table_material', tab).ajaxClick(function (response) {
        bindButtons(tab, response);
    }, function () {
        loader.show('', true);
        return true;
    });
}

SamsonCMS_InputQUANTITY = function() {
    s('.blockSubTabs').each(function(subTab){
        reloadQuantityFields(subTab);
    });
};

SamsonCMS_InputMATERIAL_TABLE = function(tab) {
    initMaterialTable(tab.parent());
    initSortable(savePriority);
};

s(document).pageInit(function(){
    SamsonCMS_InputQUANTITY();
});

// Bind input
SamsonCMS_Input.bind(SamsonCMS_InputMATERIAL_TABLE, '.material_table_tab');


function updatePriorityOnChange(tab){

    s('.sub-tab-content', tab.parent()).each(function(e){
        changePriority(s('.priority_table_material', e));
        savePriority(tab);
    });
}

/**
 * Calls when need save new priority
 * @param tab
 */
function savePriority(tab) {

    // Get all items in the tab
    var items = s('.priority_table_material', tab);

    // Get link to save priority elements
    var prioritySaveUrl = items.elements[0].a('data-href');

    // Get data
    var data = {};
    items.each(function (e) {
        data[s(e).a('data-priority')] = s(e).a('data-material');
    });

    // Show loader
    loader.show('', true);

    // Save priority of items
    $.ajax({
        url: prioritySaveUrl,
        type: 'POST',
        async: true,
        data: {ids: data},
        headers: {
            'SJSAsync': 'true'
        },
        success: function () {
            loader.hide();
        }
    });
}

/**
 * Init events on the item which have to be draggable
 * @param onEndAction Callback which will be use when user drag some item
 */
function initSortable(onEndAction) {

    // List with handle
    var id = 'template-form';

    // Get dom of main block
    var mainBlocks = document.getElementsByClassName(id);

    // Iterate all blocks
    for (var blockKey in mainBlocks) {

        // Get value
        var block = mainBlocks[blockKey];

        // Exclude field tab
        if (s(block).parent()) {
            if (s(block).parent().parent().a('id') == 'field_tab') {
                continue;
            }
        }

        // User closure for store correct value of block
        (function (block) {

            // Iterate all sub tabs
            var countOfTable = 0;
            s('.sub-tab-content', s(block)).each(function (tab) {

                // Store count of tab
                countOfTable++;

                // Iterate table
                s('.table2-body', s(tab)).each(function (table) {

                    // User closure for store correct value of table
                    (function (countOfTable) {

                        // Bind sortable plugin on dom element of item
                        Sortable.create(table.DOMElement, {
                            animation: 150,

                            // After do action
                            onEnd: function (e) {

                                // Store initiate values
                                var oldIndex = e.oldIndex;
                                var newIndex = e.newIndex;


                                // Iterate all tables and synchronize all item as in the block
                                // where the moving was doing
                                var items = s('.priority_table_material', table);
                                var countOfNewTable = 0;
                                s('.table2-body', s(block)).each(function (tableNew) {
                                    countOfNewTable++;

                                    // If it is the current block go further else synchronize
                                    if (countOfNewTable == countOfTable) {
                                        return;
                                    }

                                    // Length of items on the list
                                    var items = s('.table2-row', tableNew);
                                    var length = items.elements.length;

                                    // Set logical values
                                    var isStartElement = newIndex == 0;
                                    var isEndElement = newIndex == length - 1;
                                    var isMiddleElement = !isStartElement && !isEndElement;
                                    var isFixMove = newIndex - oldIndex < 0;

                                    // If element located in the middle of list not on the edge
                                    if (isMiddleElement) {

                                        // Fix moving on one position
                                        if (isFixMove) {
                                            items.elements[newIndex].insertBefore(items.elements[oldIndex]);
                                        } else {
                                            items.elements[newIndex + 1].insertBefore(items.elements[oldIndex]);
                                        }

                                        // End edge
                                    } else if (isEndElement) {

                                        jQuery(items.elements[oldIndex].DOMElement)
                                            .insertAfter(items.elements[length - 1].DOMElement);

                                        // Start edge
                                    } else if (isStartElement) {
                                        items.elements[newIndex].insertBefore(items.elements[oldIndex]);
                                    }

                                    // Change priority on the items of list
                                    changePriority(s('.priority_table_material', tableNew));
                                });

                                // Change priority in table
                                changePriority(items);

                                // Call passed callback
                                onEndAction(tab);
                            }
                        });
                    })(countOfTable);
                });
            });
        })(block);
    }
}

/**
 * Change priority in table
 * @param element
 */
function changePriority(element) {

    // Start value of priority
    var priority = 1;

    // Iterate all items and change priority in the each element
    element.each(function (v) {
        v.a('data-priority', priority);
        v.html(priority);
        priority++;
    });
}

function reloadQuantityFields (elm) {

    var elmParent = s(elm).parent('template-block');
    var countBlock = s('.tab-header > span b', elmParent);
    var structureID = s('.structureID', elmParent).val();
    var entityId = s('.entityID', elmParent).val();

    if (structureID != undefined && entityId != undefined && structureID >= 0 && entityId >=0) {
        $.ajax({
            url: '/cms/material_table/quantityFieldsRow/' + structureID + '/' +entityId,
            type: 'POST',
            async: true,
            headers: {
                'SJSAsync': 'true'
            },
            success: function (data) {
                data = JSON.parse(data);
                if (data['result'] = 1) {
                    if (data['countOfFields'] <= 0) {
                        countBlock.html('');
                    } else {
                        countBlock.html('('+data['countOfFields']+')');
                    }
                } else {
                    console.log('BAD request');
                }
            }
        });
    } else {
        console.log('BAD request');
    }
}
