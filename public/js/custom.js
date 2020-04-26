function agreeTermOfService() {
    document.getElementById("reserve-button").style.display = "none";
    document.getElementById("pay-button").style.display = "inline";
    document.getElementById("pay-button").disabled = false;
    document.getElementById("agreement-message").style.display = "inline";
}

function agreeTermOfService2() {
    document.getElementById("reserve-button-2").style.display = "none";
    document.getElementById("pay-button-2").style.display = "inline";
    document.getElementById("pay-button-2").disabled = false;
    document.getElementById("agreement-message-2").style.display = "inline";
}

$('[type="tel"]').keyup((e) =>{
    if (e.keyCode !== 8){
        let phoneSelector = $('#inputPhone');
        let num = phoneSelector.val().replace(/\D/g,'');
        phoneSelector.val('(' + num.substring(0,3) + ') ' + num.substring(3,6) + '-' + num.substring(6,10));
        let phoneSelector2 = $('#inputPhone2');
        let num2 = phoneSelector2.val().replace(/\D/g,'');
        phoneSelector2.val('(' + num2.substring(0,3) + ') ' + num2.substring(3,6) + '-' + num2.substring(6,10));
    }
});
