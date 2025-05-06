document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('file-upload');
    const inputPreview = document.getElementById('input-preview');
    const inputFilename = document.getElementById('input-filename');
    const outputPreview = document.getElementById('output-preview');
    const downloadButton = document.getElementById('download-button');
    const progressBar = document.getElementById('progress-bar');
    const uploadProgress = document.getElementById('upload-progress');
    const progressText = document.getElementById('progress-text');
    const status = document.getElementById('status');

    let outputBlob = null; // will store simulated output for download

    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        inputFilename.textContent = `Selected file: ${file.name}`;
        inputPreview.innerHTML = ''; // Clear previous preview
        outputPreview.innerHTML = '<p class="text-gray-500">Processing...</p>'; // show processing state
        uploadProgress.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        status.textContent = 'Processing...';

        // Preview input
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target.result;
            let previewElement;
            if (file.type.startsWith('image')) {
                previewElement = document.createElement('img');
                previewElement.src = url;
                previewElement.className = 'max-h-60 mx-auto';
            } else if (file.type.startsWith('video')) {
                previewElement = document.createElement('video');
                previewElement.src = url;
                previewElement.controls = true;
                previewElement.className = 'max-h-60 mx-auto';
            } else {
                inputPreview.innerHTML = '<p class="text-red-500">Unsupported file type</p>';
                return;
            }
            inputPreview.appendChild(previewElement);

            // Simulate upload/progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                if (progress >= 100) {
                    clearInterval(interval);
                    uploadProgress.classList.add('hidden');
                    status.textContent = 'Completed';

                    // Simulate output preview (for now same as input)
                    outputPreview.innerHTML = '';
                    const outputElement = previewElement.cloneNode(true);
                    outputPreview.appendChild(outputElement);

                    // Create downloadable blob (same file for now)
                    outputBlob = new Blob([e.target.result], { type: file.type });
                    downloadButton.disabled = false;
                }
            }, 200);
        };
        reader.readAsDataURL(file);
    });

    downloadButton.addEventListener('click', () => {
        if (!outputBlob) return;
        const url = URL.createObjectURL(outputBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `output-${Date.now()}.${fileUpload.files[0].name.split('.').pop()}`;
        a.click();
        URL.revokeObjectURL(url);
    });
});
