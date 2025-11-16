// --- API BASE URL ---
            const API_BASE = 'http://localhost:3000/api';

            // --- DEFAULT VEHICLE DATA (fallback) ---
            const DEFAULT_CAR_DATA = [
                // NOTE: All 'mainImg' and 'imgs' paths are relative (e.g., './cul11.jpeg') or Base64 strings.
                {
                    id: 1,
                    name: 'Suzuki Cultus 2006',
                    price: 'PKR 810,000',
                    mainImg: './cul11.jpeg',
                    imgs: ['./cul1.jpeg', './cul2.jpeg', './cul3.jpeg', './cul4.jpeg', './cul5.jpeg', './cul6.jpeg', './cul7.jpeg', './cul8.jpeg', './cul9.jpeg', './cul10.jpeg', './cul11.jpeg', './cul12.jpeg', './cul13.jpeg'],
                    desc: 'Genuine interior, accident-free,tires ok,outer Roof Genioun,machanically ok,Registered:Mansehra.',
                    specs: ['Engine: 1000cc', 'Condition: Very Good'],
                    sold: false
                }, {
                    id: 2,
                    name: 'Nissan Sunny 1986',
                    price: 'PKR 550,000',
                    mainImg: './nis8.jpeg',
                    imgs: ['./nis1.jpeg', './nis2.jpeg', './nis3.jpeg', './nis4.jpeg', './nis5.jpeg', './nis6.jpeg', './nis7.jpeg', './nis8.jpeg', './nis9.jpeg', './nis10.jpeg', './nis11.jpeg'],
                    desc: 'Japan Import, ideal city car,Good Condition,Interior genioun,Exterior 70-75% genioun, Mechanically ok.',
                    specs: ['Engine: 1300cc', 'Registered:1994', 'Condition: Excellent, Home Used'],
                    sold: false
                },
                // Pre-Sold Cars
                {
                    id: 3,
                    name: 'Toyota Gli 2015',
                    price: 'SOLD',
                    mainImg: './gli2015.jpg',
                    imgs: ['./gli2015.jpg'],
                    desc: 'Sold vehicle.',
                    specs: [],
                    sold: true
                }, {
                    id: 4,
                    name: 'Toyota Corolla 2011',
                    price: 'SOLD',
                    mainImg: './gli 2011.jpg',
                    imgs: ['./gli 2011.jpg'],
                    desc: 'Sold vehicle.',
                    specs: [],
                    sold: true
                }, {
                    id: 5,
                    name: 'Toyota Grandi 2024',
                    price: 'SOLD',
                    mainImg: './grandi 2024.jpg',
                    imgs: ['./grandi 2024.jpg'],
                    desc: 'Sold vehicle.',
                    specs: [],
                    sold: true
                }, {
                    id: 6,
                    name: 'Toyota Xli 2011',
                    price: 'SOLD',
                    price: 'SOLD',
                    mainImg: './xli2011.jpg',
                    imgs: ['./xli2011.jpg'],
                    desc: 'Sold vehicle.',
                    specs: [],
                    sold: true
                }
            ];

            // Load data from API or use default
            let carData = [];

            async function loadCarData() {
                try {
                    const response = await fetch(`${API_BASE}/cars`);
                    if (!response.ok) throw new Error('Failed to load cars');
                    carData = await response.json();
                    renderCars();
                } catch (error) {
                    console.error('Error loading cars:', error);
                    // Fallback to default data
                    carData = DEFAULT_CAR_DATA;
                    renderCars();
                }
            }

            async function saveCarData() {
                // Note: Individual API calls now handle saving
                // This function is kept for compatibility
                console.log('Data synced with server');
            }

            // Load data on page load
            document.addEventListener('DOMContentLoaded', () => {
                loadCarData();
                updateEditorView();
            });

            // --- ADMIN LOGIC ---
            const EDITOR_PASSWORD = "aitsam123";
            let isEditor = localStorage.getItem('isEditor') === 'true';

            function updateEditorView() {
                const adminLink = document.getElementById('adminLink');
                const editorActions = document.getElementById('editorActions');

                adminLink.innerText = isEditor ? "Logout" : "Admin Login";
                adminLink.style.color = isEditor ? 'red' : 'var(--accent)';

                editorActions.style.display = isEditor ? 'flex' : 'none';

                renderCars();
            }

            function toggleAdminPanel(e) {
                e.preventDefault();
                if (isEditor) {
                    isEditor = false;
                    localStorage.setItem('isEditor', 'false');
                    updateEditorView();
                    alert("Logged out successfully.");
                } else {
                    document.getElementById('loginModal').style.display = 'flex';
                }
            }

            function checkLogin() {
                const passwordInput = document.getElementById('editorPassword');
                const message = document.getElementById('loginMessage');
                if (passwordInput.value === EDITOR_PASSWORD) {
                    isEditor = true;
                    localStorage.setItem('isEditor', 'true');
                    document.getElementById('loginModal').style.display = 'none';
                    passwordInput.value = '';
                    message.innerText = '';
                    updateEditorView();
                    alert("Login successful! Editor mode enabled.");
                } else {
                    message.innerText = "Invalid password. Try again.";
                }
            }

            // --- EDITOR ACTIONS ---

            async function markAsSold(id) {
                if (!isEditor) return alert("Error: You must be logged in as an editor to perform this action.");

                const car = carData.find(c => c.id == id);
                if (!car) return;

                if (confirm(`Are you sure you want to mark ${car.name} as SOLD?`)) {
                    try {
                        const response = await fetch(`${API_BASE}/cars/${id}/sold`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!response.ok) throw new Error('Failed to mark as sold');

                        // Update local data
                        const carIndex = carData.findIndex(c => c.id == id);
                        carData[carIndex].sold = true;
                        carData[carIndex].price = 'SOLD';

                        renderCars();
                        alert(`${car.name} marked as SOLD!`);
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to mark car as sold. Please try again.');
                    }
                }
            }

            async function deleteVehicle(id, name) {
                if (!isEditor) return;

                if (confirm(`Are you sure you want to permanently DELETE "${name}" from the inventory?`)) {
                    try {
                        const response = await fetch(`${API_BASE}/cars/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!response.ok) throw new Error('Failed to delete car');

                        carData = carData.filter(car => car.id !== id);

                        closeModal();
                        renderCars();
                        alert(`Vehicle "${name}" successfully deleted.`);
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to delete car. Please try again.');
                    }
                }
            }

            function openEditModal(id) {
                if (!isEditor) return;

                const car = carData.find(c => c.id == id);
                if (!car) return;

                // Set up the modal for editing
                document.getElementById('modalTitle').innerText = `Edit Vehicle: ${car.name}`;
                document.getElementById('submitButton').innerText = 'Save Changes';
                document.getElementById('submitButton').style.background = '#f0ad4e';
                document.getElementById('editCarId').value = id;

                document.getElementById('addName').value = car.name || '';
                document.getElementById('addPrice').value = car.price || '';
                document.getElementById('addDesc').value = car.desc || '';
                document.getElementById('addSpecs').value = (car.specs || []).join(', ');

                document.getElementById('addMainImgFile').value = '';
                document.getElementById('addGalleryImgsFiles').value = '';

                const isBase64 = car.mainImg.startsWith('data:');
                const currentImgCount = car.imgs ? car.imgs.length : 0;

                if (isBase64 && currentImgCount > 0) {
                    document.getElementById('mainImgStatus').innerText = `Current: Image loaded. Select a new file to replace.`;
                    document.getElementById('galleryImgStatus').innerText = `Current: ${currentImgCount} total images. Select new files to replace all.`;
                } else {
                    document.getElementById('mainImgStatus').innerText = `Current: Using local image file. Select a new file to replace.`;
                    document.getElementById('galleryImgStatus').innerText = `Current: Using local image files. Select new files to replace all.`;
                }

                document.getElementById('mainImgStatus').style.color = 'blue';
                document.getElementById('galleryImgStatus').style.color = 'blue';

                document.getElementById('addVehicleModal').style.display = 'flex';
                document.getElementById('uploadMessage').innerText = '';
            }

            // --- FILE UPLOAD AND BASE64 CONVERSION ---

            function updateFileNameStatus(inputId, statusId) {
                const input = document.getElementById(inputId);
                const status = document.getElementById(statusId);
                if (input.files.length > 0) {
                    if (input.multiple) {
                        status.innerText = `${input.files.length} file(s) selected.`;
                    } else {
                        status.innerText = `File selected: ${input.files[0].name}`;
                    }
                    status.style.color = '#5cb85c';
                } else {
                    if (document.getElementById('editCarId').value === '') {
                        status.innerText = input.multiple ? 'No files selected.' : 'No file selected.';
                        status.style.color = 'var(--muted)';
                    }
                }
            }

            function readFileAsBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            async function queueFileProcessing() {
                if (!isEditor) return;

                const carId = document.getElementById('editCarId').value;
                const isEditing = carId !== '';
                let existingCar = null;

                if (isEditing) {
                    existingCar = carData.find(car => car.id == carId);
                    if (!existingCar) {
                        document.getElementById('uploadMessage').innerText = "Error: Car ID not found for editing.";
                        return;
                    }
                }

                const name = document.getElementById('addName').value;
                const price = document.getElementById('addPrice').value;
                const mainImgInput = document.getElementById('addMainImgFile');
                const galleryImgsInput = document.getElementById('addGalleryImgsFiles');
                const desc = document.getElementById('addDesc').value;
                const specsStr = document.getElementById('addSpecs').value;
                const uploadMessage = document.getElementById('uploadMessage');

                uploadMessage.innerText = '';

                if (!name || !price) {
                    uploadMessage.innerText = "Please fill in Name and Price.";
                    return;
                }

                // --- IMAGE PROCESSING LOGIC ---
                let mainImgBase64 = isEditing ? existingCar.mainImg : null;
                let finalImgs = isEditing ? existingCar.imgs : [];

                // 1. Handle Main Image Upload
                if (mainImgInput.files.length > 0) {
                    uploadMessage.style.color = 'orange';
                    uploadMessage.innerText = isEditing ? "Processing new main image..." : "Processing images...";
                    // New main image selected: process it
                    mainImgBase64 = await readFileAsBase64(mainImgInput.files[0]);
                    finalImgs = [mainImgBase64]; // Start gallery with the new main image (gallery images might follow)
                }

                // If in ADD mode, and no file selected, throw error
                if (!isEditing && mainImgInput.files.length === 0) {
                    uploadMessage.innerText = "Please select a Main Image for a new vehicle.";
                    return;
                }

                // 2. Handle Additional Gallery Images Upload
                if (galleryImgsInput.files.length > 0) {
                    uploadMessage.style.color = 'orange';
                    uploadMessage.innerText = "Processing additional gallery images...";
                    const galleryFiles = Array.from(galleryImgsInput.files);
                    const galleryBase64Promises = galleryFiles.map(file => readFileAsBase64(file));
                    const galleryBase64 = await Promise.all(galleryBase64Promises);

                    // If new main image was uploaded, combine it with new gallery images
                    if (mainImgInput.files.length > 0) {
                        finalImgs = [mainImgBase64, ...galleryBase64];
                    } else if (isEditing) {
                        // If editing, and only new gallery images are uploaded (no new main img), replace ALL gallery images but keep the old mainImg.
                        // NOTE: For simplicity, if gallery files are uploaded, we replace ALL secondary images.
                        finalImgs = [existingCar.mainImg, ...galleryBase64];
                        mainImgBase64 = existingCar.mainImg;
                    } else {
                        // This case is unlikely in 'add' mode since we require a main image, but handle it defensively.
                        finalImgs = galleryBase64;
                    }

                } else if (isEditing && mainImgInput.files.length > 0) {
                    // If editing, and new main img uploaded, but NO new gallery images, the new main img is the only item in finalImgs (set in step 1).
                    // We need to re-add the original secondary images if they exist and we didn't upload new gallery images.

                    // We'll trust the original finalImgs array unless a new gallery upload was made.
                    // If ONLY main image changed, we must update the first element of finalImgs but keep the rest.
                    if (existingCar.imgs.length > 1 && finalImgs.length === 1) {
                        // New main image uploaded (finalImgs = [newMainImg]), but no new gallery images.
                        // Preserve old secondary images (indices 1 to end).
                        finalImgs = [mainImgBase64, ...existingCar.imgs.slice(1)];
                    }

                } else if (isEditing && mainImgInput.files.length === 0 && galleryImgsInput.files.length === 0) {
                    // If editing, and no new files selected, keep existing finalImgs array (already set to existingCar.imgs)
                    finalImgs = existingCar.imgs;
                }

                // --- CONSTRUCT/UPDATE CAR OBJECT ---
                const specs = specsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

                const carPayload = {
                    name,
                    price,
                    mainImg: mainImgBase64,
                    imgs: finalImgs,
                    desc,
                    specs,
                    sold: isEditing ? existingCar.sold : false
                };

                try {
                    let response;
                    if (isEditing) {
                        response = await fetch(`${API_BASE}/cars/${carId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(carPayload)
                        });
                        uploadMessage.innerText = `Vehicle "${name}" updated successfully!`;
                    } else {
                        response = await fetch(`${API_BASE}/cars`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(carPayload)
                        });
                        uploadMessage.innerText = `Vehicle "${name}" added successfully!`;
                    }

                    if (!response.ok) throw new Error('Failed to save car');

                    const savedCar = await response.json();

                    if (isEditing) {
                        const index = carData.findIndex(c => c.id == carId);
                        carData[index] = savedCar;
                    } else {
                        carData.unshift(savedCar);
                    }

                    document.getElementById('addVehicleModal').style.display = 'none';
                    renderCars();
                    uploadMessage.style.color = '#5cb85c';

                    // Clear inputs
                    document.getElementById('addName').value = '';
                    document.getElementById('addPrice').value = '';
                    document.getElementById('addDesc').value = '';
                    document.getElementById('addSpecs').value = '';
                    document.getElementById('addMainImgFile').value = '';
                    document.getElementById('addGalleryImgsFiles').value = '';
                    document.getElementById('editCarId').value = '';
                    document.getElementById('submitButton').style.background = 'var(--accent)';
                } catch (error) {
                    console.error('Error:', error);
                    uploadMessage.style.color = 'red';
                    uploadMessage.innerText = 'Failed to save car. Please try again.';
                }
            }

            function openAddVehicleModal() {
                if (!isEditor) return;

                // Reset modal for ADD mode
                document.getElementById('modalTitle').innerText = 'Add New Vehicle';
                document.getElementById('submitButton').innerText = 'Add Vehicle';
                document.getElementById('submitButton').style.background = 'var(--accent)';
                document.getElementById('editCarId').value = '';

                // Clear all form inputs
                document.getElementById('addName').value = '';
                document.getElementById('addPrice').value = '';
                document.getElementById('addDesc').value = '';
                document.getElementById('addSpecs').value = '';
                document.getElementById('addMainImgFile').value = '';
                document.getElementById('addGalleryImgsFiles').value = '';
                document.getElementById('uploadMessage').innerText = '';

                // Reset file status displays
                document.getElementById('mainImgStatus').innerText = 'No file selected.';
                document.getElementById('galleryImgStatus').innerText = 'No files selected.';
                document.getElementById('mainImgStatus').style.color = 'var(--muted)';
                document.getElementById('galleryImgStatus').style.color = 'var(--muted)';

                document.getElementById('addVehicleModal').style.display = 'flex';
            }


            // --- CAR RENDERING LOGIC ---
            function createCarCard(car) {
                const card = document.createElement('div');
                card.className = `car-card ${car.sold ? 'sold' : ''} ${isEditor ? 'editor-mode' : ''}`;

                // ALWAYS enable click to open the modal for detail view
                card.onclick = () => openModal(car);

                let soldButton = '';
                if (isEditor && !car.sold) {
                    // Use a dataset attribute to pass the ID to the function
                    soldButton = `<div class="sold-btn" data-car-id="${car.id}">Mark Sold</div>`;
                }

                card.innerHTML = `
                    <img src="${car.mainImg}" alt="${car.name}">
                    <div class="meta">
                        <div class="name">${car.name}</div>
                        <div class="price">${car.price}</div>
                    </div>
                    ${soldButton}
                `;
                return card;
            }

            function renderCars() {
                const availableRow = document.getElementById('rowAvailable');
                const soldRow = document.getElementById('rowSold');
                availableRow.innerHTML = '';
                soldRow.innerHTML = '';

                carData.forEach(car => {
                    const card = createCarCard(car);
                    if (car.sold) {
                        soldRow.appendChild(card);
                    } else {
                        availableRow.appendChild(card);
                    }
                });

                // Add event listeners for the new "Mark Sold" buttons
                document.querySelectorAll('.sold-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent modal from opening
                        const carId = button.getAttribute('data-car-id');
                        markAsSold(carId);
                    });
                });
            }

            // --- EXISTING FUNCTIONS (Modal and Slider) ---

            document.getElementById('year').textContent = new Date().getFullYear();

            function scrollRow(id, distance) {
                const el = document.getElementById(id);
                if (!el) return;
                el.scrollBy({
                    left: distance,
                    behavior: 'smooth'
                });
            }

            const modalBack = document.getElementById('modalBack');

            function openModal(data) {
                const gallery = document.getElementById('modalGallery');
                gallery.innerHTML = '';

                // Use the 'imgs' array for the gallery. It contains Base64 strings or file paths.
                const imgsArray = Array.isArray(data.imgs) && data.imgs.length > 0 ? data.imgs : [data.mainImg];

                imgsArray.forEach((src, i) => {
                    const img = document.createElement('img');
                    img.src = src; // Works for both Base64 and file paths
                    if (i === 0) img.classList.add('active');
                    gallery.appendChild(img);
                });


                document.getElementById('modalName').innerText = data.name;
                document.getElementById('modalPrice').innerText = data.price;
                document.getElementById('modalDesc').innerText = data.desc || '';

                const specsList = document.getElementById('modalSpecs');
                specsList.innerHTML = '';
                if (Array.isArray(data.specs)) {
                    data.specs.forEach(s => {
                        const li = document.createElement('li');
                        li.innerText = s;
                        specsList.appendChild(li);
                    });
                }

                // Contact buttons visibility and links
                const whBtn = document.getElementById('whBtn');
                const callBtn = document.getElementById('callBtn');
                const phone = '+923339017459';

                if (data.sold) {
                    // Hide contact buttons for sold cars
                    whBtn.style.display = 'none';
                    callBtn.style.display = 'none';
                } else {
                    // Show contact buttons for available cars
                    whBtn.style.display = 'inline-block';
                    callBtn.style.display = 'inline-block';
                    whBtn.href = `https://api.whatsapp.com/send?phone=${phone}&text=I'm%20interested%20in%20${encodeURIComponent(data.name)}`;
                    callBtn.href = `tel:${phone}`;
                }


                // EDITOR ACTIONS SETUP
                const editorActionsDiv = document.getElementById('modalEditorActions');
                if (isEditor) {
                    editorActionsDiv.style.display = 'flex';
                    // Set up Delete button click handler
                    document.getElementById('deleteBtn').onclick = () => deleteVehicle(data.id, data.name);
                    // Set up Edit button click handler (NEW)
                    document.getElementById('editBtn').onclick = () => {
                        closeModal(); // Close detail modal first
                        openEditModal(data.id); // Open the Edit form
                    };

                } else {
                    editorActionsDiv.style.display = 'none';
                }

                modalBack.style.display = 'flex';

                let current = 0;
                const imgs = gallery.querySelectorAll('img');
                const prevBtn = document.getElementById('galleryPrev');
                const nextBtn = document.getElementById('galleryNext');

                // Show/hide gallery buttons if only one image
                prevBtn.style.display = imgs.length > 1 ? 'block' : 'none';
                nextBtn.style.display = imgs.length > 1 ? 'block' : 'none';

                function show(i) {
                    imgs[current].classList.remove('active');
                    current = (i + imgs.length) % imgs.length;
                    imgs[current].classList.add('active');
                }

                prevBtn.onclick = () => show(current - 1);
                nextBtn.onclick = () => show(current + 1);
            }

            function closeModal() {
                modalBack.style.display = 'none';
            }

            modalBack.addEventListener('click', function(e) {
                if (e.target === modalBack) closeModal();
            });

            document.addEventListener('DOMContentLoaded', () => {
                // Initial render and view update
                updateEditorView();
            });


            // === SLIDER LOGIC ===
            const slides = document.querySelectorAll(".slide");
            const dots = document.querySelectorAll(".dot");
            const slideNextBtn = document.getElementById("slideNext");
            const slidePrevBtn = document.getElementById("slidePrev");
            const slidesContainer = document.getElementById("slides");

            let currentSlide = 0;
            const totalSlides = slides.length;

            function showSlide(index) {
                currentSlide = (index + totalSlides) % totalSlides;
                slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;

                dots.forEach((dot, i) => {
                    dot.classList.toggle("active", i === currentSlide);
                });
            }

            // Manual navigation
            slideNextBtn.addEventListener("click", () => showSlide(currentSlide + 1));
            slidePrevBtn.addEventListener("click", () => showSlide(currentSlide - 1));

            // Dots navigation
            dots.forEach((dot, i) => {
                dot.addEventListener("click", () => showSlide(i));
            });

            // Automatic sliding every 2 seconds
            setInterval(() => {
                showSlide(currentSlide + 1);
            }, 2000);

