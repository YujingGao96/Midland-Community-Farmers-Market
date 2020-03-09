function agreeTermOfService() {
    document.getElementById("reserve-button").style.display = "none";
    document.getElementById("pay-button").style.display = "inline";
    document.getElementById("pay-button").disabled = false;
    document.getElementById("agreement-message").style.display = "inline";
}

function phoneMask() {
    var num = $(this).val().replace(/\D/g,'');
    $(this).val('(' + num.substring(0,3) + ') ' + num.substring(3,6) + '-' + num.substring(6,10));
}
$('[type="tel"]').keyup(phoneMask);
