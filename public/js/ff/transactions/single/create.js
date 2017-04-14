/*
 * create.js
 * Copyright (c) 2017 thegrumpydictator@gmail.com
 * This software may be modified and distributed under the terms of the Creative Commons Attribution-ShareAlike 4.0 International License.
 *
 * See the LICENSE file for details.
 */

/** global: what,Modernizr, title, breadcrumbs, middleCrumbName, button, piggiesLength, txt, middleCrumbUrl,exchangeRateInstructions */

$(document).ready(function () {
    "use strict";

    // respond to switch buttons
    updateButtons();
    updateForm();
    updateLayout();
    updateDescription();

    // hide exchange rate instructions:
    $('#exchange_rate_instruction_holder').hide();
    $('#exchanged_amount_holder').hide();

    if (!Modernizr.inputtypes.date) {
        $('input[type="date"]').datepicker(
            {
                dateFormat: 'yy-mm-dd'
            }
        );
    }

    // update currency
    $('select[name="source_account_id"]').on('change', updateCurrency);
    updateCurrency();
    $('#ffInput_amount').on('change', getExchangeRate);

    // respond to changes to the hidden input,
    // so we can show the "exchange rate" thing if necessary:
    $('.currency-option').on('click', triggerCurrencyChange);

    // get JSON things:
    getJSONautocomplete();
});

function getExchangeRate() {
    var accountId = getAccountId();
    var selectedCurrencyId = parseInt($('input[name="amount_currency_id_amount"]').val());
    var accountCurrencyId = parseInt(accountInfo[accountId].preferredCurrency);
    var selectedCurrencyCode = currencyInfo[selectedCurrencyId].code;
    var accountCurrencyCode = currencyInfo[accountCurrencyId].code;
    var date = $('#ffInput_date').val();
    var amount = $('#ffInput_amount').val();
    var uri = 'json/rate/' + selectedCurrencyCode + '/' + accountCurrencyCode + '/' + date + '?amount=' + amount;
    console.log('Will grab ' + uri);
    $.get(uri).done(updateExchangedAmount);
}

function updateExchangedAmount(data) {
    console.log('Returned data:');
    console.log(data);
    $('#ffInput_exchanged_amount').val(data.amount);
}


function triggerCurrencyChange() {
    var selectedCurrencyId = parseInt($('input[name="amount_currency_id_amount"]').val());
    var accountId = getAccountId();
    var accountCurrencyId = parseInt(accountInfo[accountId].preferredCurrency);
    console.log('Selected currency is ' + selectedCurrencyId);
    console.log('Account prefers ' + accountCurrencyId);
    if (selectedCurrencyId !== accountCurrencyId) {
        var text = exchangeRateInstructions.replace('@name', accountInfo[accountId].name);
        text = text.replace(/@account_currency/g, currencyInfo[accountCurrencyId].name);
        text = text.replace(/@transaction_currency/g, currencyInfo[selectedCurrencyId].name);
        $('.non-selectable-currency-symbol').text(currencyInfo[accountCurrencyId].symbol);
        getExchangeRate();

        $('#ffInput_exchange_rate_instruction').text(text);
        $('#exchange_rate_instruction_holder').show();
        $('#exchanged_amount_holder').show();
    }
    if (selectedCurrencyId === accountCurrencyId) {
        $('#exchange_rate_instruction_holder').hide();
        $('#exchanged_amount_holder').hide();
    }

    // if the value of the selected currency does not match the account's currency
    // show the exchange rate thing!
    return false;
}


function updateCurrency() {
    // get value:
    var accountId = getAccountId();
    var currencyPreference = accountInfo[accountId].preferredCurrency;

    $('.currency-option[data-id="' + currencyPreference + '"]').click();
    $('[data-toggle="dropdown"]').parent().removeClass('open');
    $('select[name="source_account_id"]').focus();
}

function updateDescription() {
    $.getJSON('json/transaction-journals/' + what).done(function (data) {
        $('input[name="description"]').typeahead('destroy').typeahead({source: data});
    });
}

function getJSONautocomplete() {

    // for withdrawals
    $.getJSON('json/expense-accounts').done(function (data) {
        $('input[name="destination_account_name"]').typeahead({source: data});
    });

    // for tags:
    if ($('input[name="tags"]').length > 0) {
        $.getJSON('json/tags').done(function (data) {

            var opt = {
                typeahead: {
                    source: data,
                    afterSelect: function () {
                        this.$element.val("");
                    }
                }
            };
            $('input[name="tags"]').tagsinput(
                opt
            );
        });
    }

    // for deposits
    $.getJSON('json/revenue-accounts').done(function (data) {
        $('input[name="source_account_name"]').typeahead({source: data});
    });

    $.getJSON('json/categories').done(function (data) {
        $('input[name="category"]').typeahead({source: data});
    });

}

function updateLayout() {
    "use strict";
    $('#subTitle').text(title[what]);
    $('.breadcrumb .active').text(breadcrumbs[what]);
    $('.breadcrumb li:nth-child(2)').html('<a href="' + middleCrumbUrl[what] + '">' + middleCrumbName[what] + '</a>');
    $('#transaction-btn').text(button[what]);
}

function updateForm() {
    "use strict";

    $('input[name="what"]').val(what);
    switch (what) {
        case 'withdrawal':
            // show source_id and dest_name:
            $('#source_account_id_holder').show();
            $('#destination_account_name_holder').show();

            // hide others:
            $('#source_account_name_holder').hide();
            $('#destination_account_id_holder').hide();

            // show budget:
            $('#budget_id_holder').show();

            // hide piggy bank:
            $('#piggy_bank_id_holder').hide();

            // copy destination account name to
            // source account name:
            if ($('#ffInput_destination_account_name').val().length > 0) {
                $('#ffInput_source_account_name').val($('#ffInput_destination_account_name').val());
            }

            break;
        case 'deposit':
            // show source_name and dest_id:
            $('#source_account_name_holder').show();
            $('#destination_account_id_holder').show();

            // hide others:
            $('#source_account_id_holder').hide();
            $('#destination_account_name_holder').hide();

            // hide budget
            $('#budget_id_holder').hide();

            // hide piggy bank
            $('#piggy_bank_id_holder').hide();

            if ($('#ffInput_source_account_name').val().length > 0) {
                $('#ffInput_destination_account_name').val($('#ffInput_source_account_name').val());
            }

            break;
        case 'transfer':
            // show source_id and dest_id:
            $('#source_account_id_holder').show();
            $('#destination_account_id_holder').show();

            // hide others:
            $('#source_account_name_holder').hide();
            $('#destination_account_name_holder').hide();


            // hide budget
            $('#budget_id_holder').hide();
            if (piggiesLength === 0) {
                $('#piggy_bank_id_holder').hide();
            } else {
                $('#piggy_bank_id_holder').show();
            }
            break;
        default:
            // no action.
            break;
    }
}


function updateButtons() {
    "use strict";
    $('.switch').each(function (i, v) {
        var button = $(v);

        // remove click event:
        button.unbind('click');
        // new click event:
        button.bind('click', clickButton);

        if (button.data('what') === what) {
            button.removeClass('btn-default').addClass('btn-info').html('<i class="fa fa-fw fa-check"></i> ' + txt[button.data('what')]);
        } else {
            button.removeClass('btn-info').addClass('btn-default').text(txt[button.data('what')]);
        }
    });
}

function clickButton(e) {
    "use strict";
    var button = $(e.target);
    var newWhat = button.data('what');
    if (newWhat !== what) {
        what = newWhat;
        updateButtons();
        updateForm();
        updateLayout();
        updateDescription();
    }
    return false;
}

/**
 * Get accountID based on some meta info.
 */
function getAccountId() {
    if(what === "withdrawal") {
        return $('select[name="source_account_id"]').val();
    }
    alert('Cannot handle ' + what);
}