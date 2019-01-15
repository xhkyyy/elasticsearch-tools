var p_ctx = document.getElementById('myChart').getContext('2d');
var r_ctx = document.getElementById('myChart2').getContext('2d');
var p_PieChart, r_PieChart;
$('#drawing').click(function () {
    var esurl_str = $('#esurl').val().trim();
    if (esurl_str) {
        drawingFn(esurl_str, $.trim($('#uname').val()), $.trim($('#pwd').val()));
    }
});

function genAlertWarningHtml(msg) {
    return `
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
    <strong>警告!</strong> ${msg}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
    </button>
    </div>
    `;
}

function alert_warning(alertDivId, msg, data, labels) {
    const alertDivIdObj = $('#' + alertDivId);
    alertDivIdObj.empty();
    var html = '';
    for (let index = 0; index < data.length; index++) {
        if (data[index] == 0) {
            html += genAlertWarningHtml(labels[index] + msg);
        }
    }
    if (html) {
        alertDivIdObj.append(html);
    }
}

function togDisableButton(isDisabled) {
    if (isDisabled == true) {
        $('#drawing').attr('disabled', 'disabled');
    } else {
        $('#drawing').removeAttr('disabled');
    }
}

function afterLoadData(show) {
    if (show == true) {
        $('#progress_div').removeClass('d-none');
        hideRowContentDiv('#p_shard_div,#r_shard_div', false);
        hideRowContentDiv('#progress_div', true);
        togDisableButton(true);
    } else {
        $('#progress_div').removeClass('d-none');
        togDisableButton(false);
        hideRowContentDiv('#p_shard_div,#r_shard_div', true);
        hideRowContentDiv('#progress_div', false);
    }
}

function drawingFn(esurl_str, uname, pwd) {
    afterLoadData(true);
    var data = {
        'esurl': esurl_str,
        'uname': uname,
        'pwd': pwd
    };
    var data_json_str = JSON.stringify(data);

    $.ajax({
        type: "post",
        url: '/cat_shards?s=p',
        data: data_json_str,
        contentType: 'application/json',
        success: function (data) {
            alert_warning('p_alert_msg', ' 无主片！', data.datasets[0].data, data.labels);

            if (!p_PieChart) {
                p_PieChart = new Chart(p_ctx, {
                    type: 'pie',
                    data: data,
                    options: {
                        responsive: true
                    }
                });
            } else {
                p_PieChart.data = data;
                p_PieChart.update();
            }
        },
        complete: function () {
            afterLoadData(false);
        }
    });



    $.ajax({
        type: "post",
        url: '/cat_shards?s=r',
        data: data_json_str,
        contentType: 'application/json',
        success: function (data) {
            alert_warning('r_alert_msg', ' 无副本！', data.datasets[0].data, data.labels);

            if (!r_PieChart) {
                r_PieChart = new Chart(r_ctx, {
                    type: 'pie',
                    data: data,
                    options: {
                        responsive: true
                    }
                });
            } else {
                r_PieChart.data = data;
                r_PieChart.update();
            }
        },
        complete: function () {
            afterLoadData(false);
        }
    });

}