document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('file-upload');
    const inputPreview = document.getElementById('input-preview');
    const inputFilename = document.getElementById('input-filename');
    const outputPreview = document.getElementById('output-preview');
    const outputPlaceholder = document.getElementById('output-placeholder');
    const downloadButton = document.getElementById('download-button');
    const progressBar = document.getElementById('progress-bar');
    const uploadProgress = document.getElementById('upload-progress');
    const progressText = document.getElementById('progress-text');
    const status = document.getElementById('status');
    const detectionInfo = document.getElementById('detection-info');
    const detectionList = document.getElementById('detection-list');
    const debugInfo = document.getElementById('debug-info');
    const debugPath = document.getElementById('debug-path');
    const directVideoLink = document.getElementById('direct-video-link');

    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes wave {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .progress-wavy {
            background: linear-gradient(90deg, #ff5a5a, #ff8080, #ff5a5a);
            background-size: 200% 100%;
            animation: wave 2s linear infinite;
            transition: width 0.3s ease;
        }
    `;
    document.head.appendChild(styleElement);

    const outputVideoElement = document.getElementById('output-video'); // Renamed to avoid conflict with 'outputVideo' in fileUpload listener
    if (outputVideoElement && outputVideoElement.getAttribute('src') && outputVideoElement.getAttribute('src') !== '') {
        console.log("Initial video URL found:", outputVideoElement.getAttribute('src'));
        outputVideoElement.classList.remove('hidden');
        if (outputPlaceholder) outputPlaceholder.classList.add('hidden');
    }

    let outputBlob = null;
    let originalFile = null;

    const uploadContainer = document.querySelector('label[for="file-upload"]').parentElement;
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.classList.add('border-primary');
    });
    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.classList.remove('border-primary');
    });
    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.classList.remove('border-primary');
        if (e.dataTransfer.files.length) {
            fileUpload.files = e.dataTransfer.files;
            fileUpload.dispatchEvent(new Event('change'));
        }
    });

    // Create a function to handle video loading
    function loadVideo(url, container, errorHandler) {
        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = false;
        video.className = 'max-h-60 w-full mx-auto rounded-lg';

        // Add source with proper MIME type
        const source = document.createElement('source');
        source.src = url;
        source.type = 'video/mp4';
        video.appendChild(source);

        // Handle loading success
        video.addEventListener('loadeddata', () => {
            console.log("Video loaded successfully:", url);
            if (outputPlaceholder) outputPlaceholder.classList.add('hidden'); 
            video.classList.remove('hidden');
        });

        // Handle errors
        video.addEventListener('error', (e) => {
            console.error("Video error:", e, "URL:", url);
            if (errorHandler) errorHandler(url, e);
        });

        container.innerHTML = '';
        container.appendChild(video);

        return video;
    }

    fileUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const fileType = file.type;
        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const validVideoTypes = ['video/mp4'];
        
        const isValidImage = validImageTypes.includes(fileType);
        const isValidVideo = validVideoTypes.includes(fileType);
        
        if (!isValidImage && !isValidVideo) {
            inputPreview.innerHTML = '<p class="text-red-500">Invalid file type. Please upload JPG, PNG or MP4 files only.</p>';
            return;
        }
        
        if (isValidVideo) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension !== 'mp4') {
                inputPreview.innerHTML = '<p class="text-red-500">Only MP4 video format is supported.</p>';
                return;
            }
        }

        originalFile = file;
        if (detectionInfo) detectionInfo.classList.add('hidden');
        if (detectionList) detectionList.innerHTML = '';
        if (debugInfo) debugInfo.classList.add('hidden');
        if (inputFilename) inputFilename.textContent = `Selected file: ${file.name}`;
        if (inputPreview) inputPreview.innerHTML = '';
        if (outputPreview) outputPreview.innerHTML = '<p class="text-gray-500">Processing...</p>';
        if (outputPlaceholder) outputPlaceholder.classList.remove('hidden'); // Show placeholder initially
        if (uploadProgress) uploadProgress.classList.remove('hidden');
        
        // Apply wavy red animation to the progress bar
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.classList.remove('bg-primary');
            progressBar.classList.add('progress-wavy');
        }
        
        if (progressText) progressText.textContent = '0%';
        if (status) status.textContent = 'Processing...';
        if (downloadButton) downloadButton.disabled = true;
        outputBlob = null;

        const reader = new FileReader();
        reader.onload = (e) => {
            let previewElement;
            if (file.type.startsWith('image/')) {
                previewElement = document.createElement('img');
                previewElement.src = e.target.result;
                previewElement.className = 'max-h-60 mx-auto rounded-lg';
            } else if (file.type.startsWith('video/')) {
                previewElement = document.createElement('video');
                previewElement.src = e.target.result;
                previewElement.controls = true;
                previewElement.className = 'max-h-60 w-full mx-auto rounded-lg';
            } else {
                if (inputPreview) inputPreview.innerHTML = '<p class="text-red-500">Unsupported file type for preview</p>';
                return;
            }
            if (inputPreview) inputPreview.appendChild(previewElement);
        };
        reader.readAsDataURL(file);

        // More realistic progress simulation
        let currentProgress = 0;
        const steps = [
            { target: 10, speed: 150 },   
            { target: 20, speed: 350 },  
            { target: 40, speed: 600 },
            { target: 60, speed: 800 }, 
            { target: 75, speed: 1150 },  
            { target: 90, speed: 1500 }   
        ];
        
        let stepIndex = 0;
        
        const progressInterval = setInterval(() => {
            if (stepIndex < steps.length) {
                const { target, speed } = steps[stepIndex];
                currentProgress += 1;
                
                if (currentProgress >= target) {
                    stepIndex++;
                }
                
                if (progressBar) progressBar.style.width = `${currentProgress}%`;
                if (progressText) progressText.textContent = `${currentProgress}%`;
            } else {
                clearInterval(progressInterval);
            }
        }, steps[stepIndex]?.speed || 200);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Upload failed with status: " + response.status }));
                throw new Error(errorData.details || errorData.error || "Upload failed");
            }

            const data = await response.json();
            const resultUrl = data.result_path;

            if (progressBar) {
                progressBar.style.width = '100%';
            }
            if (progressText) progressText.textContent = '100%';
            if (uploadProgress) setTimeout(() => uploadProgress.classList.add('hidden'), 500);
            if (status) status.textContent = 'Completed';
            if (outputPreview) outputPreview.innerHTML = ''; // Clear "Processing..."

            const isVideo = data.file_type === 'video' ||
                /\.(mp4|avi|mov|wmv|mkv|webm)$/i.test(resultUrl); // Added more video extensions

            if (isVideo) {
                // Add cache buster to avoid browser caching issues
                const videoSrcWithCacheBuster = `${resultUrl}?t=${Date.now()}`;

                // Show loading indicator
                if (outputPreview) outputPreview.innerHTML = '<p class="text-gray-500">Loading video result...</p>';
                if (outputPlaceholder) outputPlaceholder.classList.remove('hidden');


                setTimeout(() => { 
                    loadVideo(videoSrcWithCacheBuster, outputPreview, (url, error) => {
                        // Error handling with retry
                        if (outputPreview) outputPreview.innerHTML = `
                            <div class="text-yellow-600 p-3 bg-yellow-100 rounded-lg mb-3">
                                <p><strong>Error loading video. Retrying...</strong></p>
                                <p><small>Attempted URL: ${url}</small></p>
                            </div>`;

                        setTimeout(() => {
                            const retryUrl = `${resultUrl}?t=${Date.now()}`;
                            console.log("Retrying video load with URL:", retryUrl);
                            loadVideo(retryUrl, outputPreview, (finalUrl, finalError) => {
                                // Final error handling if retry also fails
                                if (outputPreview) outputPreview.innerHTML = `
                                    <div class="text-red-500 p-3 bg-red-100 rounded-lg">
                                        <p><strong>Error loading video</strong></p>
                                        <p>URL attempted: ${finalUrl}</p>
                                        <p>Check server logs for more details or if the file path is correct and accessible.</p>
                                    </div>`;
                                if (outputPlaceholder) outputPlaceholder.classList.remove('hidden'); // Show placeholder on final error
                            });
                        }, 2000); // Retry delay
                    });
                }, 1000); // Initial delay

                // Update detection info
                if (typeof data.detections === 'number') {
                    if (detectionInfo) detectionInfo.classList.remove('hidden');
                    if (detectionList) detectionList.innerHTML = `<div class="p-3 bg-gray-100 rounded-md shadow-sm">
                        <strong>Total Detections:</strong> <span class="font-semibold text-primary">${data.detections}</span>
                    </div>`;
                }

                // Show debug info
                if (debugInfo) debugInfo.classList.remove('hidden');
                if (debugPath) debugPath.textContent = videoSrcWithCacheBuster;
                if (directVideoLink) directVideoLink.href = videoSrcWithCacheBuster;

            } else { // Handle Images
                if (outputPlaceholder) outputPlaceholder.classList.add('hidden');
                const outputImage = document.createElement('img');
                outputImage.src = resultUrl;
                outputImage.className = 'max-h-60 mx-auto rounded-lg';

                outputImage.addEventListener('load', () => {
                    console.log("Image loaded");
                    if (outputPreview) {
                         outputPreview.innerHTML = ''; // Clear any previous message
                         outputPreview.appendChild(outputImage);
                    }
                });
                outputImage.addEventListener('error', () => {
                    if (outputPreview) outputPreview.innerHTML = '<p class="text-red-500 p-3 bg-red-100 rounded-lg">Error loading result image.</p>';
                     if (outputPlaceholder) outputPlaceholder.classList.remove('hidden'); // Show placeholder on error
                });
                if (outputPreview) {
                    outputPreview.innerHTML = '<p class="text-gray-500">Loading image result...</p>'; // Initial loading message
                }


                if (Array.isArray(data.detections) && data.detections.length > 0) {
                    if (detectionInfo) detectionInfo.classList.remove('hidden');
                    if (detectionList) detectionList.innerHTML = '';
                    data.detections.forEach((d, i) => {
                        const item = document.createElement('div');
                        item.className = 'p-3 bg-gray-100 rounded-md shadow-sm mb-2';
                        item.innerHTML = `
                            <div><strong>Detection ${i + 1}:</strong> ${d.label}</div>
                            <div>Confidence: ${(d.confidence * 100).toFixed(2)}%</div>
                            <div>Bounding Box: [${d.bbox.join(', ')}]</div>`;
                        if (detectionList) detectionList.appendChild(item);
                    });
                } else if (Array.isArray(data.detections)) {
                    if (detectionInfo) detectionInfo.classList.remove('hidden');
                    if (detectionList) detectionList.innerHTML = '<p class="text-gray-600 p-3 bg-gray-100 rounded-md shadow-sm">No detections found in the image.</p>';
                }
                 // Show debug info for images as well
                if (debugInfo) debugInfo.classList.remove('hidden');
                if (debugPath) debugPath.textContent = resultUrl;
                if (directVideoLink) directVideoLink.href = resultUrl; // Link to image
            }

            // download functionality
            if (downloadButton) downloadButton.disabled = false;
            try {
                const fileResponse = await fetch(resultUrl);
                if (!fileResponse.ok) {
                    throw new Error(`Failed to fetch the result file for download. Status: ${fileResponse.status}`);
                }
                const blob = await fileResponse.blob();
                outputBlob = blob;

                const newDownloadButton = downloadButton.cloneNode(true);
                downloadButton.parentNode.replaceChild(newDownloadButton, downloadButton);

                newDownloadButton.addEventListener('click', () => {
                    if (!outputBlob) {
                        console.error("Output blob not available for download.");
                        if (status) status.textContent = 'Error: File for download not ready.';
                        return;
                    }
                    const a = document.createElement('a');
                    const extension = outputBlob.type.includes('video') ? (resultUrl.split('.').pop() || 'mp4') : (resultUrl.split('.').pop() || 'jpg');
                    const downloadName = `output_${Date.now()}.${extension}`;
                    a.href = URL.createObjectURL(outputBlob);
                    a.download = downloadName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a); // Clean up
                    URL.revokeObjectURL(a.href);
                });
                 if (downloadButton) downloadButton.disabled = false;

            } catch (fetchError) {
                console.error("Error fetching result file for download:", fetchError);
                if (status) status.textContent = 'Error preparing download.';
                if (downloadButton) downloadButton.disabled = true;
                if (outputPreview && !isVideo) { 
                    outputPreview.innerHTML += `<p class="text-red-500 text-sm">Could not prepare file for download: ${fetchError.message}</p>`;
                } else if (outputPreview && isVideo) {
                    const existingContent = outputPreview.innerHTML;
                    outputPreview.innerHTML = existingContent + `<p class="text-red-500 text-sm mt-2">Note: Could not prepare file for download: ${fetchError.message}</p>`;
                }
            }

        } catch (err) {
            clearInterval(progressInterval);
            if (status) status.textContent = 'Error';
            if (uploadProgress) uploadProgress.classList.add('hidden');
            console.error("Upload or processing failed:", err);
            if (outputPreview) outputPreview.innerHTML = `<p class="text-red-500 p-3 bg-red-100 rounded-lg">${err.message}</p>`;
            if (outputPlaceholder) outputPlaceholder.classList.remove('hidden'); 
            if (downloadButton) downloadButton.disabled = true;
        }
    });
});