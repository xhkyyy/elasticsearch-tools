var ctx = document.getElementById('myChart').getContext('2d');
var transportChart;
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
        hideRowContentDiv('#transport_rx_div,#transport_tx_div', false);
        hideRowContentDiv('#progress_div', true);
        togDisableButton(true);
    } else {
        $('#progress_div').removeClass('d-none');
        togDisableButton(false);
        hideRowContentDiv('#transport_rx_div,#transport_tx_div', true);
        hideRowContentDiv('#progress_div', false);
    }
}

function buildChart(horizontalBarChartData) {
    return new Chart(ctx, {
        type: 'horizontalBar',
        data: horizontalBarChartData,
        options: {
            elements: {
                rectangle: {
                    borderWidth: 0,
                }
            },
            responsive: true,
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: ''
            }
        }
    });
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
        url: '/cat_node_stats',
        data: data_json_str,
        contentType: 'application/json',
        success: function (data) {
            if (!transportChart) {
                transportChart = buildChart(data);
            } else {
                transportChart.data = data;
                transportChart.update();
            }
        },
        complete: function () {
            afterLoadData(false);
        }
    });
}