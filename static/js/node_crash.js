function genCheckBoxHtml(checkbox_name) {
    return `
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${checkbox_name}" id="defaultCheck1">
        <label class="form-check-label" for="defaultCheck1">
        ${checkbox_name}
        </label>
    </div><br>
    `;
}

function genIndexListHtml(shards, msg, find) {
    var dg_type;
    if (find) {
        dg_type = 'success'
    } else {
        dg_type = 'danger';
    }

    return `
        <tr>
            <th scope="row">${shards.id}</th>
            <td>${shards.name}</td>
            <td>${shards.role}</td>
            <td><span class="badge badge-${dg_type}">${msg}</span></td>
        </tr>
    `;
}

var es_nodes;
var shard_map;

function build_shard_map_key(shard) {
    return shard.name + '#######' + shard.id;
}

function afterLoadData() {
    hideRowContentDiv('#progress_div', false);
    hideRowContentDiv('#indexDataDiv', true);
}

$('#loading').click(function () {
    var esurl_str = $('#esurl').val().trim();
    if (esurl_str) {
        hideRowContentDiv('#progress_div', true);
        hideRowContentDiv('#indexDataDiv', false);
        var data = {
            'esurl': esurl_str,
            'uname': $.trim($('#uname').val()),
            'pwd': $.trim($('#pwd').val())
        };
        var data_json_str = JSON.stringify(data);

        $.ajax({
            type: "post",
            url: "/node_list",
            data: data_json_str,
            contentType: 'application/json',
            success: function (data) {
                $('#indexs_list_body').empty();
                var checkboxObj = $('#nodes_checkbox');
                checkboxObj.empty();
                shard_map = new Map();
                var nodes_checkbox = '';
                data.nodes.forEach(function (ele) {
                    nodes_checkbox += genCheckBoxHtml(ele.node);
                    ele.shards.p_list.forEach(function (shard) {
                        add_shark_map(build_shard_map_key(shard), ele.node);
                    });
                    ele.shards.r_list.forEach(function (shard) {
                        add_shark_map(build_shard_map_key(shard), ele.node);
                    });
                });
                checkboxObj.html(nodes_checkbox);
                es_nodes = data.nodes;
            },
            complete: function () {
                afterLoadData();
            }
        });
    }
});

function add_shark_map(k, v) {
    if (shard_map.has(k)) {
        shard_map.get(k).push(v);
    } else {
        var l = [];
        l.push(v);
        shard_map.set(k, l);
    }
}

$(document).on('click', '.form-check-input', function () {
    var indexsListObj = $('#indexs_list_body');
    indexsListObj.empty();
    var es_affect_shards = [],
        crash_node_map = new Map(),
        checkedObj = $('.form-check-input:checked');

    if (checkedObj && checkedObj.length > 0) {
        $('#indexs_list').removeClass('d-none');
    } else {
        $('#indexs_list').addClass('d-none');
    }
    checkedObj.each(function (i, box) {

        var box_id = $(this);
        crash_node_map.set(box_id.val(), true);
        es_nodes.forEach(function (ele) {
            if (ele.node == box_id.val()) {
                ele.shards.p_list.forEach(function (shard) {
                    es_affect_shards.push(shard);
                });
                ele.shards.r_list.forEach(function (shard) {
                    es_affect_shards.push(shard);
                });
            }
        });

    });

    indexsListObj.html(genDisIndexListHtml(es_affect_shards, crash_node_map));
});

function delDupShards(shards) {
    var m1 = new Map();
    var shards_list = [];
    shards.forEach(function (shard) {
        var key = shard.name + '#######' + shard.id + '#######' + shard.role;
        if (!m1.has(key)) {
            shards_list.push(shard);
            m1.set(key, 0);
        }
    });
    return shards_list;
}

function genDisIndexListHtml(shards, crash_node_map) {
    if (!shards || shards.length <= 0) {
        return '';
    }

    shards = delDupShards(shards);

    var html = '';
    shards.forEach(function (shard) {
        var back_node = shard_map.get(build_shard_map_key(shard));
        var find = false;
        var msg = '';
        if (back_node) {
            back_node.forEach(function (node) {
                if (!crash_node_map.has(node)) {
                    msg += node + ', ';
                    find = true;
                }
            });
        }

        if (!msg) {
            msg = '不可恢复！';
        } else {
            msg = msg.substr(0, msg.length - 2);
        }
        html += genIndexListHtml(shard, msg, find);
    });
    return html;
}