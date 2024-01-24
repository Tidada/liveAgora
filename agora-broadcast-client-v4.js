/**
 * Agora Broadcast Client
 */

 var agoraAppId = appIdAgora; // set app id
 var channelName = agorachannelName; // set channel name

// create client instance
const client = AgoraRTC.createClient({mode: 'live', codec: 'vp8'}); // h264 better detail at a higher motion
const screenShareClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
var mainStreamId; // reference to main stream
const myDiv = document.getElementById('myDiv');
// set video profile
// [full list: https://docs.agora.io/en/Interactive%20Broadcast/videoProfile_web?platform=Web#video-profile-table]
var cameraVideoProfile = '1080p_5'; // 960 × 720 @ 30fps  & 750kbs

var localTracks = { 
    videoTrack: null,
    audioTrack: null
};
var localTracksStream = {
  screenVideoTrack: null, 
  audioTrack: null,
  screenAudioTrack: null
};
var localTrackState = {
  videoTrackEnabled: true,
  audioTrackEnabled: true
}
var screenEnable = false;
var remoteUsers = {};
// keep track of streams
var options = {
  uid: null, 
  accountName  : null,
  appid: appIdAgora,
  channel: agorachannelName,
  role: role, // host or audience
  audienceLatency: 2,
  camera: {
    camId: '',
    micId: '',
    stream: {}
  }
};

// keep track of devices
var devices = {
  cameras: [],
  mics: []
}
var isLoggedIn = false;

var handRaiseState = false;
// set log level:
// -- .DEBUG for dev
// -- .NONE for prod
AgoraRTC.setLogLevel(1);

// init Agora SDK

$("#mute-audio").click(function (e) {
  if (localTrackState.audioTrackEnabled) {
    $("#mute-audio").html(' <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height="26px"><path fill="white" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L472.1 344.7c15.2-26 23.9-56.3 23.9-88.7V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 21.2-5.1 41.1-14.2 58.7L408 294.5c5.2-11.8 8-24.8 8-38.5V96c0-53-43-96-96-96s-96 43-96 96v54.3L38.8 5.1zM272 187.9V96c0-26.5 21.5-48 48-48s48 21.5 48 48V256c0 2.3-.2 4.6-.5 6.8L272 187.9zm-80 59.4L144.7 210c-.5 1.9-.7 3.9-.7 6v40c0 89.1 66.2 162.7 152 174.4V464H248c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H344V430.4c20.4-2.8 39.7-9.1 57.3-18.2l-43.1-33.9C346.1 382 333.3 384 320 384c-70.7 0-128-57.3-128-128v-8.7z"/></svg> ');
    $(this).attr('data-original-title',textUnmuteAudio ).tooltip('hide').tooltip('show');
    muteAudio();
  } else {
    $("#mute-audio").html('<svg xmlns="http://www.w3.org/2000/svg" height="26"  viewBox="0 0 384 512"><path fill="white" d="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464H120c-13.3 0-24 10.7-24 24s10.7 24 24 24h72 72c13.3 0 24-10.7 24-24s-10.7-24-24-24H216V430.4c85.8-11.7 152-85.3 152-174.4V216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128s-128-57.3-128-128V216z"/></svg>');
    $(this).attr('data-original-title',textMuteAudio).tooltip('hide').tooltip('show');
    unmuteAudio();
  }
});

$("#mute-video").click(function (e) {
  if (localTrackState.videoTrackEnabled) {
    
    $("#mute-video").html('<svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 0 640 512"><path fill="white" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-86.4-67.7 13.8 9.2c9.8 6.5 22.4 7.2 32.9 1.6s16.9-16.4 16.9-28.2V128c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.9 1.6l-96 64L448 174.9V192 320v5.8l-32-25.1V128c0-35.3-28.7-64-64-64H113.9L38.8 5.1zM407 416.7L32.3 121.5c-.2 2.1-.3 4.3-.3 6.5V384c0 35.3 28.7 64 64 64H352c23.4 0 43.9-12.6 55-31.3z"/></svg>');
    $(this).attr('data-original-title',textUnmuteVideo ).tooltip('hide').tooltip('show');
    muteVideo();
  } else {
    $("#mute-video").html('<svg xmlns="http://www.w3.org/2000/svg" height="26"  viewBox="0 0 576 512" ><path fill="white" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V320 192 174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"/></svg>');
    $(this).attr('data-original-title',textMuteVideo ).tooltip('hide').tooltip('show');
    unmuteVideo();
  }
});
$("#leave-div-btn").click(function (e) {
    leave();
})
 
$("#screen-share").click(function (e) {
    if(screenEnable)
    {
        
        $(this).attr('data-original-title',textStopShareScreen ).tooltip('hide').tooltip('show');
        stopshareScreen();
    }
    else
    {
      $(this).attr('data-original-title',textShareScreen ).tooltip('hide').tooltip('show');
        shareScreen();
    }
    
 
});

async function joinChannel() { 
options.accountName = username;

client.setClientRole(options.role);

   $("#mic-btn").prop("disabled", false);
    $("#video-btn").prop("disabled", false);

  if (options.role === "audience") {
      
        $("#mic-btn").prop("disabled", true);
        $("#video-btn").prop("disabled", true);
        $("#raise-hand-div").append(`
        <div class="icon-wrapper">
        <button class="control-icon btn-live raisehand" id="raise-hand" data-toggle="tooltip" data-placement="top" title="${textRaiseHand}">
        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512 512" height="26px"><path fill="white" d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V336c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64H304c97.2 0 176-78.8 176-176V128c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V32z"/></svg>                      
                        </button>
        </div>`);
        
        // Event listeners
        client.on("user-published", handleUserPublished); 
        client.on("user-left", handleUserLeft);

      // add event listener to play remote tracks when remote user publishs.
      /*client.on("user-published", handleUserPublished);
      client.on("user-unpublished", handleUserUnpublished);*/
  }


  try {
    options.uid = await client.join(options.appid, options.channel, options.token || null );
    //await screenShareClient.join(options.appid, options.channel, options.token  || null ); // Use a different user ID for the screen share

    if (options.role === "host") {
        console.log('option uid');
      $('#mic-btn').prop('disabled', false);
      $('#video-btn').prop('disabled', false);
      client.on("user-published", handleUserPublished); 
      client.on("user-left", handleUserLeft);
 
        // create local audio and video tracks
        localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack({ });

        showMuteButton();
        var footer_icon = document.getElementById('footers');

        if(footer_icon)
        {
           document.getElementById('footers').style.display = 'block' 
        }
        
         let player = $(`
            <div class="video-containers" id="player-wrapper-${options.uid}">
               <div class="video-player player" id="player-${options.uid}" ></div>
            </div>
          `);
         $("#user-streams").append(player);
        // play local video track
        localTracks.videoTrack.play(`player-${options.uid}`);
         $("#local-player-name").text(`localTrack(${options.uid})`);
        // publish local tracks to channel
        await client.publish(Object.values(localTracks));
        console.log("Successfully published.");
        // Get Cameras
        AgoraRTC.getCameras()
        .then(function(cameras) {
          devices.cameras = cameras; // store cameras array
            cameras.forEach(function(camera, i){
              var name = camera.label.split('(')[0];
              var optionId = 'camera_' + i;
              var deviceId = camera.deviceId;
              if (i === 0 && options.camera.camId === '') {
                options.camera.camId = deviceId;
              }
              $('#camera-list').append('<a class="dropdown-item" id="' + optionId + '">' + name + '</a>');
            });
            $('#camera-list a').click(function(event) {
              var index = event.target.id.split('_')[1];
              console.log('Cameras available: '+ index);
              changeStreamSource(index, "video");
            });
        })
        .catch(function(err) {
          console.log('Error get cameras', err);
        });

        // Get Microphones
        AgoraRTC.getMicrophones()
        .then(function(mics) {
          devices.mics = mics; // store cameras array
            mics.forEach(function(mic, i){
              var name = mic.label.split('(')[0];
              var optionId = 'mic_' + i;
              var deviceId = mic.deviceId;
              if(i === 0 && options.camera.micId === ''){
                options.camera.micId = deviceId;
              }
              if(name.split('Default - ')[1] != undefined) {
                name = '[Default Device]' // rename the default mic - only appears on Chrome & Opera
              }
              $('#mic-list').append('<a class="dropdown-item" id="' + optionId + '">' + name + '</a>');
            });
            $('#mic-list a').click(function(event) {
              var index = event.target.id.split('_')[1];
              changeStreamSource(index, "autio");
            });
        })
        .catch(function(err) {
          console.log('Error get Microphones', err);
        });
 
    }// if is host

    console.log("join success");
  } catch (e) {
    console.log("join failed", e);
  }
}  
async function RTMJoin() { // Create Agora RTM client

    const clientRTM = AgoraRTM.createInstance(agoraAppId, { enableLogUpload: true });
    var Username = username;
    // Login
    clientRTM.login({ uid: Username }).then(() => {
        console.log('AgoraRTM client login success. Username: ' + Username);
        isLoggedIn = true;
        // RTM Channel Join
        var channelName = agorachannelName; 
        channel = clientRTM.createChannel(channelName);
        channel.join().then(() => {
            console.log('AgoraRTM client channel join success.');
            // Send channel message for raising hand
            $(document).on('click', '#raise-hand', async function () {
              
                fullDivId = $(this).attr('id');
                if (handRaiseState === false) {
                    $("#raise-hand").html(' <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512 512" height="26px"><path fill="#6f42c1" d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V336c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64H304c97.2 0 176-78.8 176-176V128c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V32z"/></svg> ');
                    $(this).attr('data-original-title',textLowerHand ).tooltip('hide').tooltip('show');

                    handRaiseState = true;
                    $('.control-icon-host').css("display", "block");
                    console.log("Hand raised.");
                    // Inform channel that rand was raised
                    await channel.sendMessage({ text: "raised" }).then(() => {
                        console.log("Message sent successfully.");
                        console.log("Your message was: raised" + " sent by: " + Username);
                    }).catch((err) => {
                        console.error("Message sending failed: " + err);
                    })
                }
                else if (handRaiseState === true) {

                    $("#raise-hand").html(' <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 512 512" height="26px"><path fill="white" d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V336c0 1.5 0 3.1 .1 4.6L67.6 283c-16-15.2-41.3-14.6-56.6 1.4s-14.6 41.3 1.4 56.6L124.8 448c43.1 41.1 100.4 64 160 64H304c97.2 0 176-78.8 176-176V128c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V240c0 8.8-7.2 16-16 16s-16-7.2-16-16V32z"/></svg> ');
                    $(this).attr('data-original-title',textRaiseHand ).tooltip('hide').tooltip('show');
                    
                    handRaiseState = false;
                    console.log("Hand lowered.");
                    // Inform channel that rand was raised
                    await channel.sendMessage({ text: "lowered" }).then(() => {
                        console.log("Message sent successfully.");
                        console.log("Your message was: lowered" + " sent by: " + Username);
                    }).catch((err) => {
                        console.error("Message sending failed: " + err);
                    })
                }
            });
            // Get all members in RTM Channel
            channel.getMembers().then((memberNames) => {
                console.log("------------------------------");
                console.log("All members in the channel are as follows: ");
                console.log(memberNames);
                var newHTML = $.map(memberNames, function (singleMember) {
                    if (singleMember != Username && singleMember != creator_name) {
                        return (`<li class="mt-2">
                                      <div class="row">
                                          <strong class="mb-0 text-capitalize">${singleMember}</strong>
                                          <div class="mb-4">
                                         <span> 
        <a href="#" class="mx-3 remoteHost hostOn" id="remoteAudio-${singleMember}">${make_as_host}</a></span> 
            <span> 
          <a href="#" class=" remoteAudience audienceOn" id="remoteVideo-${singleMember}">  ${make_as_viewer}</a></span> 
                                        </div>
                                       </div>
                                       
                             </li>`);
                    }
                });
                $("#insert-all-users").html(newHTML.join(""));
            });
            // Send peer-to-peer message for changing role to host
            $(document).on('click', '.remoteHost', function () {
                fullDivId = $(this).attr('id');
                peerId = fullDivId.substring(fullDivId.indexOf("-") + 1);
                console.log("Remote host button pressed.");
                let peerMessage = "host";
                clientRTM.sendMessageToPeer({
                        text: peerMessage
                    },
                    peerId,
                ).then(sendResult => {
                    if (sendResult.hasPeerReceived) {
                        console.log("Message has been received by: " + peerId + " Message: " + peerMessage);
                    } else {
                        console.log("Message sent to: " + peerId + " Message: " + peerMessage);
                    }
                })
            });
            // Send peer-to-peer message for changing role to audience
            $(document).on('click', '.remoteAudience', function () {
                fullDivId = $(this).attr('id');
                peerId = fullDivId.substring(fullDivId.indexOf("-") + 1);
                console.log("Remote audience button pressed.");
                let peerMessage = "audience";
                clientRTM.sendMessageToPeer({
                        text: peerMessage
                    },
                    peerId,
                ).then(sendResult => {
                    if (sendResult.hasPeerReceived) {
                        console.log("Message has been received by: " + peerId + " Message: " + peerMessage);
                    } else {
                        console.log("Message sent to: " + peerId + " Message: " + peerMessage);
                    }
                })
            });
            // Get channel message when someone raises hand
            channel.on('ChannelMessage', async function (text, peerId) {
                console.log(peerId + " changed their hand raise state to " + text.text);
                if (options.role === "host") {
                    if (text.text == "raised") {
                        // Ask host if user who raised their hand should be called onto stage or not
                        $('#confirm').modal('show');
                        $('#modal-body').text(peerId + " raised their hand. Do you want to make them a host?");
                        $('#promoteAccept').click(async function () {
                            // Call user onto stage
                            console.log("The host accepted " + peerId + "'s request.");
                            await clientRTM.sendMessageToPeer({
                                text: "host"
                            },
                                peerId,
                            ).then(sendResult => {
                                if (sendResult.hasPeerReceived) {
                                    console.log("Message has been received by: " + peerId + " Message: host");
                                } else {
                                    console.log("Message sent to: " + peerId + " Message: host");
                                }
                            }).catch(error => {
                                console.log("Error sending peer message: " + error);
                            });
                            $('#confirm').modal('hide');
                        });
                        $("#cancel").click(async function () {
                            // Inform the user that they were not made a host
                            console.log("The host rejected " + peerId + "'s request.");
                            await clientRTM.sendMessageToPeer({
                                text: "audience"
                            },
                                peerId,
                            ).then(sendResult => {
                                if (sendResult.hasPeerReceived) {
                                    console.log("Message has been received by: " + peerId + " Message: audience");
                                } else {
                                    console.log("Message sent to: " + peerId + " Message: audience");
                                }
                            }).catch((error) => {
                                console.log("Error sending peer message: " + error);
                            });
                            $('#confirm').modal('hide');
                        });
                    } else if (text.text == "lowered") {
                        $('#confirm').modal('hide');
                        console.log("Hand lowered so host can ignore this.");
                    }
                }
            })
            // Display messages from host when they approve the request
            clientRTM.on('MessageFromPeer', async function ({
                text
            }, peerId) {
                console.log(peerId + " changed your role to " + text);
                if (text === "host") {
                    await leave();
                    options.role = "host";
                    console.log("Role changed to host.");
                    await client.setClientRole("host");
                    await joinChannel();  
                    $("#raise-hand").attr("disabled", false);
                     $("#host-join").attr("disabled", true);
                    $("#audience-join").attr("disabled", true);

                    //$("#leave").attr("disabled", false);
                } else if (text === "audience" && options.role !== "audience" ) {
                    await leave();
                    options.role = "audience";
                    console.log("Role changed to audience.");
                    await client.setClientRole("audience");
                    await joinChannel();
                    $("#host-join").attr("disabled", true);
                    $("#audience-join").attr("disabled", true);

                    //alert("The host rejected your proposal to be called onto stage.");
                    /*$("#raise-hand").attr("disabled", false);*/
                }
                /* else if (text == "audience") {
                    await leave();
                    options.role = "audience";
                    console.log("Role changed to audience 2.");
                    await client.setClientRole("audience");
                    await joinChannel();
                    $("#host-join").attr("disabled", true);
                    $("#audience-join").attr("disabled", true);
                }*/
            })
            // Display channel member joined updated users
            channel.on('MemberJoined', function () {
                // Get all members in RTM Channel
                channel.getMembers().then((memberNames) => {
                    console.log("New member joined so updated list is: ");
                    console.log(memberNames);
                    var newHTML = $.map(memberNames, function (singleMember) {
                        if (singleMember != Username) {
                            return (`<li class="mt-2">
                            <div class="row">
                                <strong class="mb-0 text-capitalize">${singleMember}</strong>
                                <div class="mb-4">
                               <span> 
                          <a href="#" class="mx-3 remoteHost hostOn" id="remoteAudio-${singleMember}">${make_as_host}</a></span> 
                            <span> 
                          <a href="#" class=" remoteAudience audienceOn" id="remoteVideo-${singleMember}">  ${make_as_viewer}</a></span> 
                                                        </div>
                                                      </div>
                                                      
                                            </li>`);
                        }
                    });
                    $("#insert-all-users").html(newHTML.join(""));
                });
            })
            // Display channel member left updated users
            channel.on('MemberLeft', function () {
                // Get all members in RTM Channel
                channel.getMembers().then((memberNames) => {
                    console.log("A member left so updated list is: ");
                    console.log(memberNames);
                    var newHTML = $.map(memberNames, function (singleMember) {
                        if (singleMember != Username) {
                            return (`<li class="mt-2">
                            <div class="row">
                                <strong class="mb-0 text-capitalize">${singleMember}</strong>
                                <div class="mb-4">
                               <span> 
                              <a href="#" class="mx-3 remoteHost hostOn" id="remoteAudio-${singleMember}">${make_as_host}</a></span> 
                                <span> 
                              <a href="#" class=" remoteAudience audienceOn" id="remoteVideo-${singleMember}">  ${make_as_viewer}</a></span> 
                              </div>
                             </div>
                             
                   </li>`);
                        }
                    });
                    $("#insert-all-users").html(newHTML.join(""));
                });
            });
        }).catch(error => {
            console.log('AgoraRTM client channel join failed: ', error);
        }).catch(err => {
            console.log('AgoraRTM client login failure: ', err);
        });
    });
    // Logout
    /*document.getElementById("leave").onclick = async function () {
        console.log("Client logged out of RTM.");
        await clientRTM.logout();
    }*/
}

async function leave() {
    console.log(options.uid);
    if (options.role === "audience") {
        $("#raise-hand-div").empty();
    }
    /*for (trackName in localTracks) {
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            $('#mic-btn').prop('disabled', true);
            $('#video-btn').prop('disabled', true);
            localTracks[trackName] = null;
        }
    }*/
    for(let i = 0 ; localTracks.length > i ; i++)
    {
        localTracks[i].stop();
        localTracks[i].close();
    }
    // remove remote users and player views
    remoteUsers = {};

      let player_old = document.getElementById(`player-wrapper-${options.uid}`)
        console.log('player:', player_old)
        if (player_old != null){
            player_old.remove()
        }
       // var elements = document.getElementsByClassName("video-containers");

// Check if there are any elements with the specified class
/*if (elements.length > 0) {
  // Set the display style to 'none' for the first element in the collection
  elements[0].style.display = 'none';
}*/

    /*$("#remote-playerlist").html("");
        var elements = document.getElementsByClassName("video-containers");
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.display = 'none';
        }*/
    // leave the channel
    await client.leave();
     
    //document.getElementById('user-streams').innerHTML = ''
    /*$("#local-player-name").text("");
    $("#host-join").attr("disabled", false);
    $("#audience-join").attr("disabled", false);*/
    $("#leave").attr("disabled", true);
    $("#raise-hand").attr("disabled", true);
    console.log("Client successfully left channel.");
}

function changeStreamSource(deviceIndex, deviceType) {
  console.log('Switching stream sources for: ' + deviceType);
  var deviceId;
  var existingStream = false;

  if (deviceType === "video") {
    deviceId = devices.cameras[deviceIndex].deviceId;

    localTracks.videoTrack.setDevice(deviceId);
    options.camera.camId = deviceId;
    localTracks.videoTrack.setEncoderConfiguration(cameraVideoProfile);
  }

  if (deviceType === "audio") {
    deviceId = devices.mics[deviceIndex].deviceId;

    localTracks.audioTrack.setDevice(deviceId);
    options.camera.camId = deviceId;

  }
}


async function shareScreen() {
    // Event Listeners for user published and unpublished events
    screenShareClient.on("user-published", handleUserPublished);
    screenShareClient.on("user-unpublished", handleUserUnpublished);

    try {
        // Join the channel
        const uid = await screenShareClient.join(options.appid, options.channel, options.token || null);

 
        // Create microphone audio track
         localTracksStream.screenAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: "music_standard" });
        // Create screen video track
          localTracksStream.screenVideoTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_5" }, "auto");

        let screenVideoTrack;
        let screenAudioTrack;

        if (Array.isArray(localTracksStream.screenVideoTrack)) {
            [screenVideoTrack, screenAudioTrack] = localTracksStream.screenVideoTrack;
        } else {
            screenVideoTrack = localTracksStream.screenVideoTrack;
        }

        screenVideoTrack.on("track-ended", () => {
            alert(`Screen-share track ended, stop sharing screen ${screenVideoTrack.getTrackId()}`);
            screenVideoTrack.close();
            screenAudioTrack?.close();
            localTracksStream.screenAudioTrack?.close();
            screenShareClient.unpublish([screenVideoTrack, screenAudioTrack, localTracksStream.screenAudioTrack].filter(Boolean));
        });

        const tracks = screenAudioTrack
            ? [screenVideoTrack, localTracksStream.screenAudioTrack, screenAudioTrack]
            : [screenVideoTrack, localTracksStream.screenAudioTrack];

        // Publish local tracks to channel
        await screenShareClient.publish(tracks);
        screenEnable = true;
        console.log("publish success screen");
    } catch (err) {
        console.error(err);
    }
}

async function stopshareScreen() {  localTracksStream.screenVideoTrack && localTracksStream.screenVideoTrack.close();  localTracksStream.screenAudioTrack && localTracksStream.screenAudioTrack.close();

 const tracksToUnpublish = []; 
if (localTracksStream.screenVideoTrack) 
{ 
tracksToUnpublish.push(localTracksStream.screenVideoTrack); } 
if (localTracksStream.screenAudioTrack) 
{ 
tracksToUnpublish.push(localTracksStream.screenAudioTrack); 
}

  await screenShareClient.unpublish(tracksToUnpublish); 
  screenEnable = false;

}
// client callbacks
client.on('stream-published', function (evt) {
  console.log('Publish local stream successfully');
  // beauty effects are processor intensive
  // evt.stream.setBeautyEffectOptions(true, {
  //   lighteningContrastLevel: 2,
  //   lighteningLevel: 0.5,
  //   smoothnessLevel: 0.8,
  //   rednessLevel: 0.5
  // });
});

//live transcoding events..
client.on('liveStreamingStarted', function (evt) {
  console.log("Live streaming started");
});

client.on('liveStreamingFailed', function (evt) {
  console.log("Live streaming failed");
});

client.on('liveStreamingStopped', function (evt) {
  console.log("Live streaming stopped");
});

client.on('liveTranscodingUpdated', function (evt) {
  console.log("Live streaming updated");
});

// ingested live stream
client.on('streamInjectedStatus', function (evt) {
  console.log("Injected Steram Status Updated");
  console.log(JSON.stringify(evt));
});

// when a remote stream leaves the channel
client.on('peer-leave', function(evt) {
  console.log('Remote stream has left the channel: ' + evt.stream.getId());
});

// show mute icon whenever a remote has muted their mic
client.on('mute-audio', function (evt) {
  console.log('Mute Audio for: ' + evt.uid);
});

client.on('unmute-audio', function (evt) {
  console.log('Unmute Audio for: ' + evt.uid);
});

// show user icon whenever a remote has disabled their video
client.on('mute-video', function (evt) {
  console.log('Mute Video for: ' + evt.uid);
});

client.on('unmute-video', function (evt) {
  console.log('Unmute Video for: ' + evt.uid);
});

/*function leaveChannel() {

  client.leave(function() {
    console.log('client leaves channel');
    options.camera.stream.stop() // stop the camera stream playback
    options.camera.stream.close(); // clean up and close the camera stream
    client.unpublish(options.camera.stream); // unpublish the camera stream
    //disable the UI elements
    $('#mic-btn').prop('disabled', true);
    $('#video-btn').prop('disabled', true);
    $('#exit-btn').prop('disabled', true);
    $("#add-rtmp-btn").prop("disabled", true);
    $("#rtmp-config-btn").prop("disabled", true);
  }, function(err) {
    console.log('client leave failed ', err); //error handling
  });
}*/

 

function handleUserLeft(user) {
  const id = user.uid;
  delete remoteUsers[id];
  console.log('leeeft');
  $(`#player-wrapper-${id}`).remove();
}
async function subscribe(user, mediaType) { 
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("Successfully subscribed.");
  if (mediaType === 'video') {
    let player = document.getElementById(`player-wrapper-${uid}`)
        if (player != null){
            player.remove()
        }
        if(options.role !== "audience")
        {
            var footer_icon = document.getElementById('footers');   
            if(footer_icon)
            {
               document.getElementById('footers').style.display = 'block' 
            }
        }
        if ($(`#player-wrapper-${uid}`).length === 0) {

            player = $(`
                  <div class="video-containers" id="player-wrapper-${uid}"> 
                     <div class="video-player player" id="player-${uid}" ></div>
                  </div>
                `);
                $("#user-streams").append(player);
        }
       
    console.log('appended');
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === 'audio') { 
    user.audioTrack.play();
    // $('#liveAudio').click(function(event) {
    //     if (user.audioTrack.isPlaying) {
    //         user.audioTrack.stop();
    //         $('#liveAudio').html('<i class="fas fa-volume-mute"></i>');
    //         return;
    //     }
    //     user.audioTrack.play();
    //     $('#liveAudio').html('<i class="fas fa-volume-up"></i>');
    //   });

  }
 
}
    


/*document.addEventListener('click', async (event) => {
    if (event.target && event.target.className === 'requestJoinButton') {
    client.setClientRole("host");
    }
});*/
 function handleUserPublished(user, mediaType) {
      console.log('"user-published" event for remote users is triggered.');

  const id = user.uid;
  remoteUsers[id] = user;
    subscribe(user, mediaType);
}
/*function handleUserJoined(user, mediaType) {
  console.log('joined host');
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}*/

function handleUserUnpublished(user, mediaType) {
      console.log('"user-unpublished" event for remote users is triggered.');


    if (mediaType === 'video') {
        const id = user.uid;
        delete remoteUsers[id];
       $(`#player-wrapper-${id}`).remove();  
    }
}

async function muteAudio() {
  if (!localTracks.audioTrack) return;
  await localTracks.audioTrack.setEnabled(false);
  localTrackState.audioTrackEnabled = false;
  $("#mute-audio > a").html('<i class="bi-mic mr-1"></i> '+textUnmuteAudio);
  document.getElementById('mute-audio').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
}

async function muteVideo() {
  if (!localTracks.videoTrack) return;
  await localTracks.videoTrack.setEnabled(false);
  localTrackState.videoTrackEnabled = false;
  $("#mute-video > a").html('<i class="bi-camera-video mr-1"></i> '+textUnmuteVideo);
  document.getElementById('mute-video').style.backgroundColor ='rgb(255, 80, 80, 0.7)';
}

async function unmuteAudio() {
  if (!localTracks.audioTrack) return;
  await localTracks.audioTrack.setEnabled(true);
  localTrackState.audioTrackEnabled = true;
  $("#mute-audio > a").html('<i class="bi-mic-mute mr-1"></i> '+textMuteAudio);
    document.getElementById('mute-audio').style.backgroundColor ='#1f1f1f8e'

}

async function unmuteVideo() {
  if (!localTracks.videoTrack) return;
  await localTracks.videoTrack.setEnabled(true);
  localTrackState.videoTrackEnabled = true;
  $("#mute-video > a").html('<i class="bi-camera-video-off mr-1"></i> '+textMuteVideo);
   document.getElementById('mute-video').style.backgroundColor ='#1f1f1f8e'
}
function showMuteButton() {
  $("#video-btn").css("display", "inline-block");
  $("#mic-btn").css("display", "inline-block");
}
// Find active speakers
client.enableAudioVolumeIndicator();
client.on("volume-indicator", volumes => {
    volumes.forEach((volume) => {
        console.log(`UID ${volume.uid} Level ${volume.level}`);
        if (options.uid == volume.uid && volume.level > 5) {
            $(".video-player").css({
                "box-shadow": "0 2px 4px 0 #0C9DFD, 0 2px 5px 0 #0C9DFD"
            });
        } else if (options.uid == volume.uid && volume.level < 5) {
            $(".video-player").css({
                "box-shadow": "none"
            });
        }
        if (options.uid != volume.uid && volume.level > 5) {
            $("#player-" + volume.uid).css({
                "box-shadow": "0 2px 4px 0 #0C9DFD, 0 2px 5px 0 #0C9DFD"
            });
        } else if (options.uid != volume.uid && volume.level < 5) {
            $("#player-" + volume.uid).css({
                "box-shadow": "none"
            });
        }
    });
})
