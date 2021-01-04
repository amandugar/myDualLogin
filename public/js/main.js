const socket = io();

let i = 1;
let buttonType = "";
const onIncorrect = `<div class="alert alert-warning alert-dismissible fade show" role="alert">Passwords Not Matching
<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`

function checkPassword() {
    const password = $("#password").val();
    const confirmPassword = $("#confirmPassword").val();

    if (confirmPassword === password) {
        return true;
    }
    if (i == 1) {
        $("#cfDiv").append(onIncorrect);
        i++;
    }
    return false;
}

$("#buttonForm").click(() => {
    buttonType = $('#buttonForm').val();
    $("#slidervalue").prop('required', false);
    $("#maxValue").hide();
    $("#sliderMax").removeAttr("name");
    console.log(buttonType)
})

$("#sliderForm").click(function () {
    buttonType = $('#sliderForm').val();
    $("#slidervalue").prop('required', true);
    $("#maxValue").show();
    $("#sliderMax").attr("name", "maxvalue");
    console.log(buttonType)
})

function sendButtonData(username, buttonId, buttonSerial, status) {
    socket.emit('recieveButtonData', {
        username,
        buttonId,
        buttonSerial,
        status
    })
}

function sendSliderData(username, buttonId, buttonSerial, currVal) {
    socket.emit('recieveSliderData', {
        username,
        buttonId,
        buttonSerial,
        currVal
    })
}