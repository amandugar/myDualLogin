let i = 1;
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