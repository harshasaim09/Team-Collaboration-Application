$( document ).ready(function() {
	$('#leaderboadButton').hide();
	$('#signOutButton').hide();
	$('#loginButton').show();
	$('#signupButton').show();
});

//login user
function login() {
	var username = $('#loginEmailId').val()
	var password = $('#loginPassword').val()

  if(username=="" || password==""){
    alert('All Fields are required')
  }
  else{
	let url = 'http://rubick-env.6k6pdsdupw.us-east-2.elasticbeanstalk.com/login'
	//let url = 'http://localhost:3050/login'
	var data = [];
	data = {};
	data.username = username;
	data.password = password;
	//console.log(username+password);

	$.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(response){
                    $('#goToHome').prop("href", "/home");
                },
				complete: function(response) {
					var data = JSON.stringify(response);
					console.log('data after complete: '+data);
					if(data.includes(username)) {
					goHome();

					}
					else{
						alert('user credentials are incorrect')
					}
				}
            });
          }
}


function goHome() {
	$("#goToHome")[0].click();
}

//sign up user
function signUp() {

let username = $('#emailId').val()
if ($('#psw').val() != $('#psw-repeat').val()) {
    alert('Passwords do not match, please re enter password')
}
else {
    var password = $('#psw-repeat').val();
}
let teamName = $('#teamName').val();
let fullName = $('#name').val();
let firstName = fullName.split(' ').slice(0, -1).join(' ');
let lastName = fullName.split(' ').slice(-1).join(' ');
let phonenumber = $('#phonenumber').val();

if(username=="" || password=="" || teamName=="" || fullName=="" || phonenumber=="") {
  alert('All Fields are required')
}
else{
let url = 'http://rubick-env.6k6pdsdupw.us-east-2.elasticbeanstalk.com/signup'
//let url = 'http://localhost:3050/signup'
	var data = [];
	data = {};
	data.username = username;
	data.password = password;
	data.teamName = teamName;
	data.firstName = firstName;
	data.lastName = lastName;
  data.phonenumber = phonenumber;

	$.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(response){
                    $('#goToHome').prop("href", "/home");
                },
                complete: function(response) {
					var data = JSON.stringify(response);
					console.log('data after complete: '+data);
					goHome();

				}

            });
}
}
