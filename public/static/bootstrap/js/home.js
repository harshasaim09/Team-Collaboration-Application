
	$('#loginButton').hide();
	$('#signupButton').hide();
	$('#signOutButton').show();
	$('#leaderboardButton').show()


//testing datepicker
$('#datepicker').datepicker();
console.log('assigned id here: '+$('#assignedTo').children(":selected").attr("id"));

$('.checkAll').on('click', function () {
    $(this).closest('table').find('tbody :checkbox')
      .prop('checked', this.checked)
      .closest('tr').toggleClass('selected', this.checked);
  });

  $('tbody :checkbox').on('click', function () {
    $(this).closest('tr').toggleClass('selected', this.checked);

    $(this).closest('table').find('.checkAll').prop('checked', ($(this).closest('table').find('tbody :checkbox:checked').length == $(this).closest('table').find('tbody :checkbox').length));
  });


$("#submitTask").click(function(){

	if($("#taskDetail").val() == "" || $("#assignedTo").val() == "" || $('#datepicker').val() == ""){
        alert("All fields are required!");
	}
	else
	{

	var ratingText = $("#taskLevel").val();
	let rating = ratingText[ratingText.length - 1];

	//let url = 'http://localhost:3050/home/addTask'
	let url = 'http://rubick-env.6k6pdsdupw.us-east-2.elasticbeanstalk.com/home/addTask'
	var data = [];
	data = {};
	data.description = $("#taskDetail").val();
	data.rating = rating;
	data.assignedTo = $('#assignedTo').children(":selected").attr("id");
	data.dueDate = $('#datepicker').val();

	$.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(response){

                },
				complete: function(response) {
					var data = JSON.stringify(response);

					appendTask();
				}
            });

	}

});

function appendTask() {
	$("#"+$("#taskLevel").val()+" .tasks_container")
        .append(
        "<div class=\"tasks\">"+
        "<p>"+ $("#taskDetail").val()+"</p>"+
        "<br><p>Assigned To: "+
        $('#assignedTo').children(":selected").val()+"</p>"+"<br><p>Due date: "+
		$('#datepicker').val()+"</p>"+
        "</div>");
        $(".tasks_container > div").draggable({ revert: true });
		$('#taskModal').css('display','none');
}

$(".tasks_container > div").draggable({ revert: true});

$("#trash").droppable({
	  hoverClass: "ui-state-hover",
		drop: function( event, ui ) {
			$(this).addClass( "ui-state-highlight" )
        $item = ui.draggable;
				console.log("dropped element "+$item.children("#rating").text());
				console.log("dropped element "+$item.children("#taskId").text());
				let taskId = $item.children("#taskId").text();
				let rating = $item.children("#rating").text();
				submitTask(taskId,rating);
                $item.remove();
        }
        //hoverClass: "ui-state-active"
	});

function submitTask(taskId,rating){
	//let url = 'http://localhost:3050/home/submitTask'
	let url = 'http://rubick-env.6k6pdsdupw.us-east-2.elasticbeanstalk.com/home/submitTask'
	var data = [];
	data = {};
	data.taskId = taskId;
	data.rating = rating;

	$.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(response){

                },
				complete: function(response) {
					var data = JSON.stringify(response);
					console.log('data after complete: '+data);
				}
            });

}

function retrieveArchive() {
	$('#openTasks').hide();
	$('#archivedTasks').show();
	$('#restoreBtn').show();
	$('#submitTask').hide();

}

function retrieveOpen() {
	$('#openTasks').show();
	$('#archivedTasks').hide();
	$('#restoreBtn').hide();
}

function restoreSelected() {
	var taskArray = [];
	var ratingArray = [];
	var completedByArray = [];

	$('input:checked').each(function() {
		if(this.id){
		taskArray.push(this.id);
		let completedBy = $(this).closest("tr").find('td:eq(4)').text();
		let points  = parseFloat($(this).closest("tr").find('td:eq(5)').text());
    ratingArray.push(points);
		completedByArray.push(completedBy);
	}
	});
	console.log('taskArray here: '+taskArray)
	console.log('ratingarray here: '+ratingArray)
	console.log('completedBy here: '+completedByArray)
	//let url = 'http://localhost:3050/home/restoreTask'
	let url = 'http://rubick-env.6k6pdsdupw.us-east-2.elasticbeanstalk.com/home/restoreTask'
	var data = [];
	data = {};
	data.taskArray = taskArray;
	data.ratingArray = ratingArray;
	data.completedByArray = completedByArray;

	$.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function(response){
									$('#restoreReload').prop("href", "/home");
                },
								complete: function(response) {
									if(response){
										console.log('restored: '+response)
										$("#restoreReload")[0].click();
									}

								}
			});

}
