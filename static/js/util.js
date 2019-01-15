function hideRowContentDiv(selector, show) {
    $(selector).each(function (i, this_) {
        var ts = $(this_);
        if (show == true && ts.hasClass('d-none')) {
            ts.removeClass('d-none');
        } else if (show == false && !ts.hasClass('d-none')) {
            ts.addClass('d-none');
        }
    });
}