/**
 * JavaScript file for handling file uploads and UAV detection processing
 * Manages the UI interactions for the file upload component
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const fileUpload = document.getElementById('file-upload');
    const inputPreview = document.getElementById('input-preview');
    const inputFilename = document.getElementById('input-filename');
    const outputPreview = document.getElementById('output-preview');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const uploadProgress = document.getElementById('upload-progress');
    const downloadButton = document.getElementById('download-button');
    const statusText = document.getElementById('status');

    // If any element doesn't exist, return early
    if (!fileUpload || !inputPreview || !outputPreview) {
        console.warn('Upload component elements not found.');
        return;
    }

    // Initialize the file upload component
    initFileUpload(fileUpload, inputPreview, inputFilename, outputPreview, 
                  progressBar, progressText, uploadProgress, downloadButton, statusText);

    // Handle drag and drop functionality
    initDragAndDrop(fileUpload);
});

/**
 * Initializes the file upload component and its related functionality
 * @param {HTMLElement} fileUpload - File input element
 * @param {HTMLElement} inputPreview - Container to preview the input file
 * @param {HTMLElement} inputFilename - Element to display the filename
 * @param {HTMLElement} outputPreview - Container to display detection results
 * @param {HTMLElement} progressBar - Progress bar element for upload progress
 * @param {HTMLElement} progressText - Text element to show progress percentage
 * @param {HTMLElement} uploadProgress - Container for progress elements
 * @param {HTMLElement} downloadButton - Button to download detection results
 * @param {HTMLElement} statusText - Text element to show processing status
 */
function initFileUpload(fileUpload, inputPreview, inputFilename, outputPreview, 
                       progressBar, progressText, uploadProgress, downloadButton, statusText) {
    
    // Listen for file selection
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Reset previous detection
        resetDetection(outputPreview, downloadButton, statusText);

        // Show filename
        inputFilename.textContent = file.name;
        
        // Create and display file preview
        createFilePreview(file, inputPreview);
        
        // Show and animate progress bar
        uploadProgress.classList.remove('hidden');
        
        // Process the file through our backend
        uploadAndProcessFile(file, progressBar, progressText, outputPreview, downloadButton, statusText);
    });

    // Handle download button click
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const resultUrl = downloadButton.getAttribute('data-result-url');
            if (resultUrl) {
                // Create temporary link and trigger download
                const link = document.createElement('a');
                link.href = resultUrl;
                link.download = 'uav_detection_result' + getFileExtension(resultUrl);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                showError('No result file available to download.');
            }
        });
    }
}

/**
 * Creates a preview for the uploaded file (image or video)
 * @param {File} file - The uploaded file object
 * @param {HTMLElement} previewContainer - Container to display the preview
 */
function createFilePreview(file, previewContainer) {
    // Clear previous preview
    while (previewContainer.firstChild) {
        previewContainer.removeChild(previewContainer.firstChild);
    }
    
    // Display preview based on file type
    if (file.type.startsWith('image/')) {
        // Create image element
        const img = document.createElement('img');
        img.classList.add('w-full', 'h-full', 'object-contain', 'rounded-lg');
        img.file = file;
        previewContainer.appendChild(img);
        
        // Use FileReader to load the image data
        const reader = new FileReader();
        reader.onload = (function(aImg) { 
            return function(e) { 
                aImg.src = e.target.result; 
            }; 
        })(img);
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        // Create video element
        const video = document.createElement('video');
        video.classList.add('w-full', 'h-full', 'object-contain', 'rounded-lg');
        video.controls = true;
        video.file = file;
        previewContainer.appendChild(video);
        
        // Use FileReader to load the video data
        const reader = new FileReader();
        reader.onload = (function(aVideo) { 
            return function(e) { 
                aVideo.src = e.target.result; 
            }; 
        })(video);
        reader.readAsDataURL(file);
    } else {
        // Unsupported file type
        const unsupportedMsg = document.createElement('p');
        unsupportedMsg.classList.add('text-danger');
        unsupportedMsg.textContent = 'Unsupported file type';
        previewContainer.appendChild(unsupportedMsg);
    }
}

/**
 * Uploads the file to the server and processes it for UAV detection
 * @param {File} file - The file to upload and process
 * @param {HTMLElement} progressBar - Progress bar element
 * @param {HTMLElement} progressText - Text element to show progress percentage
 * @param {HTMLElement} outputPreview - Container to display detection results
 * @param {HTMLElement} downloadButton - Button to download results
 * @param {HTMLElement} statusText - Text element to show processing status
 */
function uploadAndProcessFile(file, progressBar, progressText, outputPreview, downloadButton, statusText) {
    // Create FormData object for the file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Create XMLHttpRequest for upload with progress tracking
    const xhr = new XMLHttpRequest();
    
    // Handle upload progress
    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percentComplete + '%';
            progressText.textContent = percentComplete + '%';
        }
    });
    
    // Handle response when upload complete
    xhr.addEventListener('load', function() {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                
                // Update status to processing
                statusText.textContent = 'Processing...';
                statusText.classList.add('animate-pulse');
                
                // Wait for processing to complete (in real app, this might involve WebSockets or polling)
                // For now, we simulate processing time
                setTimeout(() => {
                    displayDetectionResults(response, outputPreview, downloadButton, statusText);
                }, 2000);
                
            } catch (error) {
                console.error('Error parsing response:', error);
                showError('Error processing response from server.');
                resetDetection(outputPreview, downloadButton, statusText);
            }
        } else {
            // Handle error responses
            try {
                const response = JSON.parse(xhr.responseText);
                showError(response.error || 'Error uploading file.');
            } catch (e) {
                showError('Error uploading file.');
            }
            resetDetection(outputPreview, downloadButton, statusText);
        }
    });
    
    // Handle network or other errors
    xhr.addEventListener('error', function() {
        showError('Network error occurred while uploading.');
        resetDetection(outputPreview, downloadButton, statusText);
    });
    
    // Set up and send the request
    xhr.open('POST', '/upload', true);
    xhr.send(formData);
}

/**
 * Displays the UAV detection results in the output preview
 * @param {Object} response - The server response with results
 * @param {HTMLElement} outputPreview - Container to display results
 * @param {HTMLElement} downloadButton - Button to download results
 * @param {HTMLElement} statusText - Text element to show processing status
 */
function displayDetectionResults(response, outputPreview, downloadButton, statusText) {
    // Remove loading animation
    statusText.classList.remove('animate-pulse');
    
    // Clear previous output
    while (outputPreview.firstChild) {
        outputPreview.removeChild(outputPreview.firstChild);
    }
    
    if (response.success) {
        // Display number of detections
        statusText.textContent = `Detection complete: ${response.detections} UAVs found`;
        
        // Create a container for the output
        const outputContainer = document.createElement('div');
        outputContainer.classList.add('relative', 'w-full', 'h-full');
        
        // Check file type from the result path
        const extension = getFileExtension(response.result_path).toLowerCase();
        
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) {
            // For images
            const img = document.createElement('img');
            img.classList.add('w-full', 'h-full', 'object-contain', 'rounded-lg');
            img.src = response.result_path;
            img.alt = 'UAV Detection Result';
            outputContainer.appendChild(img);
        } else if (['.mp4', '.avi', '.mov', '.wmv'].includes(extension)) {
            // For videos
            const video = document.createElement('video');
            video.classList.add('w-full', 'h-full', 'object-contain', 'rounded-lg');
            video.controls = true;
            video.src = response.result_path;
            outputContainer.appendChild(video);
        }
        
        outputPreview.appendChild(outputContainer);
        
        // Enable download button and set result URL
        downloadButton.disabled = false;
        downloadButton.setAttribute('data-result-url', response.result_path);
    } else {
        // Display error message
        statusText.textContent = 'Error: Detection failed';
        
        const errorMsg = document.createElement('p');
        errorMsg.classList.add('text-danger');
        errorMsg.textContent = response.error || 'An unknown error occurred.';
        outputPreview.appendChild(errorMsg);
    }
}

/**
 * Resets the detection output area
 * @param {HTMLElement} outputPreview - Container to display results
 * @param {HTMLElement} downloadButton - Button to download results
 * @param {HTMLElement} statusText - Text element to show processing status
 */
function resetDetection(outputPreview, downloadButton, statusText) {
    // Reset status text
    statusText.textContent = 'Ready';
    statusText.classList.remove('animate-pulse');
    
    // Clear output preview
    while (outputPreview.firstChild) {
        outputPreview.removeChild(outputPreview.firstChild);
    }
    
    // Add default message
    const defaultMsg = document.createElement('p');
    defaultMsg.classList.add('text-gray-500');
    defaultMsg.textContent = 'Process an input file to see detection results';
    outputPreview.appendChild(defaultMsg);
    
    // Disable download button
    downloadButton.disabled = true;
    downloadButton.removeAttribute('data-result-url');
}

/**
 * Initialize drag and drop functionality for the upload component
 * @param {HTMLElement} fileInput - The file input element
 */
function initDragAndDrop(fileInput) {
    const dropZone = fileInput.closest('label');
    if (!dropZone) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });