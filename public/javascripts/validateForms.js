// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
    'use strict'
    //bsCustomInput.init();
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.validated-form')

    // Loop over them and prevent submission
    Array.from(forms)
        .forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
        })
})()

// Bootstrap form validation
(function () {
    'use strict';

    // Fetch all forms that need validation
    const forms = document.querySelectorAll('.needs-validation');

    // Loop over them and prevent submission
    Array.from(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
})();

// Image preview functionality
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('image');
    const previewContainer = document.getElementById('imagePreviewContainer');
    
    if (imageInput && previewContainer) {
        imageInput.addEventListener('change', function() {
            previewContainer.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const preview = document.createElement('img');
                    preview.classList.add('img-thumbnail', 'mt-2', 'mb-3');
                    preview.style.maxHeight = '200px';
                    preview.src = e.target.result;
                    
                    previewContainer.appendChild(preview);
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});
