
const cameraView = document.querySelector('.camera-view');
const recordButton = document.querySelector('.record-wrapper');
const flipButton = document.querySelector('.camera-option.flip');
const videoContainer = document.querySelector('.video-container');

// video constraints
const constraints = {
  video: {
    width: {
      min: 1280,
      ideal: 1920,
      max: 2560,
    },
    height: {
      min: 720,
      ideal: 1080,
      max: 1440,
    },
  },
  audio: true
};

// use front face camera
let useFrontCamera = true;

// current video stream
let videoStream;

// media recorder
let mediaRecorder;

// cached video frames
// while recording
let cachedFrames = [];



// ffmpeg

const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({
  log: true
});

async function transcodeVideo(recordedBlob) {
  
  // load ffmpeg
  console.info('[ffmpeg] Loading');
  await ffmpeg.load();
  
  console.info('[ffmpeg] Start transcoding');
  
  // transcode video
  await ffmpeg.write('recording.webm', recordedBlob);
  await ffmpeg.transcode('recording.webm', 'output.mp4');
  
  console.info('[ffmpeg] Completed transcoding');
  
  // read transcoded video
  const data = ffmpeg.read('output.mp4');
  
  // create blob URL from transcoded video
  const recordedMediaURL = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
  
  console.info('[createObjectURL] Created object URL from transcoded video');
  
  // create a video element
  // to store the recorded media
  const recordedMedia = document.createElement('video');
  recordedMedia.controls = true;
    
  // use the created URL as the
  // source of the video element
  recordedMedia.src = recordedMediaURL;

  // Create a download button that lets the 
  // user download the recorded media
  const downloadButton = document.createElement('a');

  // Set the download attribute to true so that
  // when the user clicks the link the recorded
  // media is automatically gets downloaded.
  downloadButton.download = 'true';

  downloadButton.href = recordedMediaURL;
  downloadButton.innerText = 'Download video';

  downloadButton.onclick = () => {

    /* After download revoke the created URL
                using URL.revokeObjectURL() method to 
                avoid possible memory leak. Though, 
                the browser automatically revokes the 
                created URL when the document is unloaded,
                but it's still good to revoke the created 
                URLs */
    URL.revokeObjectURL(recordedMediaURL);
    
  };

  // remove first element in container div
  if (videoContainer.children.length > 10) {
    videoContainer.children[0].remove();
  }
  
  // append video element to container div
  videoContainer.append(
    recordedMedia, downloadButton);
  
  console.info('[video] Created video element and stored recorded media');
  
}


// create video from cached frames
function createVideoFromCachedFrames() {

  // create blob from cached frames
  const recordedBlob = new Blob(
    cachedFrames, {
      type: 'video/webm'
    });
  
  // clear cached frames array
  //cachedFrames = [];
  
  transcodeVideo(recordedBlob);
  
}


// stop video stream
function stopVideoStream() {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

// initialize
async function initializeCamera() {
  
  constraints.video.facingMode = useFrontCamera ? "user" : "environment";
  
  if (useFrontCamera) {
    cameraView.classList.add('flipped');
  } else {
    cameraView.classList.remove('flipped');
  }
  
  
  // stop video stream
  stopVideoStream();
  
  /*try {*/
    
    // get user media
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    cameraView.srcObject = videoStream;
    cameraView.play();
    
    
    // create a new media recorder instance
    mediaRecorder = new MediaRecorder(videoStream, {
      mimeType: 'video/webm; codecs=vp9'
    });

    // whenever data is available, push frames to array
    mediaRecorder.ondataavailable = (e) => {

      console.log(e.data);

      // push the recorded media data to
      // the frames array
      cachedFrames.push(e.data);

    };

    // when the MediaRecorder stops recording,
    // create video from recorded frames
    mediaRecorder.onstop = createVideoFromCachedFrames;
  
  /*} catch (err) {
    
    alert('Could not access the camera');
    
  }*/
  
}


// start recording
function startRecording() {

  if (mediaRecorder) {
    
    // clear cached frames array
    //cachedFrames = [];
    
    // start recording
    mediaRecorder.start();
    
  }
    
}

// stop recording
function stopRecording() {
  
  if (mediaRecorder) {
    
    // stop the recording
    mediaRecorder.stop();
      
  }
  
}

function wait(callback, time) {
  window.setTimeout(callback, time);
}

recordButton.addEventListener('click', (e) => {
  
  e.preventDefault();
  
  // if not already recording
  if (!recordButton.classList.contains('recording')) {
    
    recordButton.classList.add('recording');
    
    // start recording
    startRecording();
    
  } else {
    
    recordButton.classList.remove('recording');
    
    // stop recording
    stopRecording();
    
  }
  
}, false);


flipButton.addEventListener('click', () => {
  
  useFrontCamera = !useFrontCamera;
  
  if (useFrontCamera) {
    
    cameraView.classList.add('flipping-to-user');
    
    wait(() => {
      
      cameraView.classList.remove('flipping-to-user');
      
    }, 400);
    
  } else {
    
    cameraView.classList.add('flipping-to-env');
    
    wait(() => {
      
      cameraView.classList.remove('flipping-to-user');
      
    }, 400);
    
  }
  
  initializeCamera();
  
});


initializeCamera();
