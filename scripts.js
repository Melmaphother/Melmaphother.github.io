// Global variables
let allPublications = [];
let allProjects = [];
let showingSelectedPublications = true;
let showingSelectedProjects = true;
let currentLang = 'en';

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'zh' : 'en';
    updateLanguage();
}

function updateLanguage() {
    // Basic body class switch
    document.body.className = document.body.className.replace(/\blang-\w+\b/g, '');
    document.body.classList.add('lang-' + currentLang);

    // Update title
    document.title = currentLang === 'en' ? 'Daoyu Wang - Homepage' : '王道宇 - 个人主页';

    // Update button visual
    const btnEn = document.getElementById('btn-en');
    const btnZh = document.getElementById('btn-zh');
    if (btnEn && btnZh) {
        btnEn.classList.toggle('active', currentLang === 'en');
        btnZh.classList.toggle('active', currentLang === 'zh');
    }

    // Update dynamic text
    const togglePubBtn = document.getElementById('toggle-publications');
    const togglePubHeader = document.getElementById('toggle-header');
    if (togglePubBtn && togglePubHeader) {
        if (currentLang === 'zh') {
            togglePubBtn.textContent = showingSelectedPublications ? '显示全部' : '只显示精选';
            togglePubHeader.textContent = showingSelectedPublications ? '精选论文' : '所有论文';
        } else {
            togglePubBtn.textContent = showingSelectedPublications ? 'Show All' : 'Show Selected';
            togglePubHeader.textContent = showingSelectedPublications ? 'Selected Publications' : 'All Publications';
        }
    }

    const toggleProjBtn = document.getElementById('toggle-projects');
    const toggleProjHeader = document.getElementById('projects-toggle-header');
    if (toggleProjBtn && toggleProjHeader) {
        if (currentLang === 'zh') {
            toggleProjBtn.textContent = showingSelectedProjects ? '显示全部' : '只显示精选';
            toggleProjHeader.textContent = showingSelectedProjects ? '精选项目与竞赛' : '所有项目与竞赛';
        } else {
            toggleProjBtn.textContent = showingSelectedProjects ? 'Show All' : 'Show Selected';
            toggleProjHeader.textContent = showingSelectedProjects ? 'Selected Projects and Competitions' : 'All Projects and Competitions';
        }
    }

    // Re-render dynamically loaded lists to update links text
    if (allPublications.length > 0) renderPublications(showingSelectedPublications);
    if (allProjects.length > 0) renderProjects(showingSelectedProjects);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    updateLanguage();
    // Load publications and projects data
    loadPublications();
    loadProjects();

    // Initialize animation delays for sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });

    // Add event listener for toggle buttons
    const togglePublicationsButton = document.getElementById('toggle-publications');
    if (togglePublicationsButton) {
        togglePublicationsButton.addEventListener('click', togglePublications);
    }

    const toggleProjectsButton = document.getElementById('toggle-projects');
    if (toggleProjectsButton) {
        toggleProjectsButton.addEventListener('click', toggleProjects);
    }
});

// Load publications from JSON file
function loadPublications() {
    fetch('publications.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Publications loaded successfully:", data);
            allPublications = data.publications;
            renderPublications(true);
        })
        .catch(error => {
            console.error('Error loading publications:', error);
            // Create fallback publications display if JSON loading fails
            displayFallbackPublications();
        });
}

// Fallback if JSON loading fails
function displayFallbackPublications() {
    const container = document.getElementById('publications-container');
    container.innerHTML = `Error loading publications.`;
}

// Toggle between showing all or selected publications
function togglePublications() {
    showingSelectedPublications = !showingSelectedPublications;
    updateLanguage();
}

// Render publications based on selection state
function renderPublications(selectedOnly) {
    const publicationsContainer = document.getElementById('publications-container');
    publicationsContainer.innerHTML = '';

    const pubsToShow = selectedOnly ?
        allPublications.filter(pub => pub.selected === 1) :
        allPublications;

    pubsToShow.forEach(publication => {
        const pubElement = createPublicationElement(publication);
        publicationsContainer.appendChild(pubElement);
    });
}

// Create HTML element for a publication
function createPublicationElement(publication) {
    const pubItem = document.createElement('div');
    pubItem.className = 'publication-item';

    // Create thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'pub-thumbnail';
    thumbnail.onclick = () => openModal(publication.thumbnail);

    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = publication.thumbnail;
    thumbnailImg.alt = `${publication.title} thumbnail`;
    thumbnail.appendChild(thumbnailImg);

    // Create content container
    const content = document.createElement('div');
    content.className = 'pub-content';

    // Add title
    const title = document.createElement('div');
    title.className = 'pub-title';
    title.textContent = publication.title;
    content.appendChild(title);

    // Add authors with highlight
    const authors = document.createElement('div');
    authors.className = 'pub-authors';

    // Format authors with highlighting
    let authorsHTML = '';
    publication.authors.forEach((author, index) => {
        if (author.includes('Daoyu Wang')) {
            authorsHTML += `<span class="highlight-name">${author}</span>`;
        } else {
            authorsHTML += author;
        }

        if (index < publication.authors.length - 1) {
            authorsHTML += ', ';
        }
    });

    authors.innerHTML = authorsHTML;
    content.appendChild(authors);

    // Add venue with award if present
    const venueContainer = document.createElement('div');
    venueContainer.className = 'pub-venue-container';

    const venue = document.createElement('div');
    venue.className = 'pub-venue';
    venue.textContent = publication.venue;
    venueContainer.appendChild(venue);

    // Add award if it exists
    if (publication.award && publication.award.length > 0) {
        const award = document.createElement('div');
        award.className = 'pub-award';
        award.textContent = publication.award;
        venueContainer.appendChild(award);
    }

    content.appendChild(venueContainer);

    // Add links if they exist
    if (publication.links) {
        const links = document.createElement('div');
        links.className = 'pub-links';

        if (publication.links.pdf) {
            const pdfLink = document.createElement('a');
            pdfLink.href = publication.links.pdf;
            pdfLink.textContent = currentLang === 'en' ? '[Paper]' : '[论文]';
            links.appendChild(pdfLink);
        }

        if (publication.links.code) {
            const codeLink = document.createElement('a');
            codeLink.href = publication.links.code;
            codeLink.textContent = currentLang === 'en' ? '[Code]' : '[代码]';
            links.appendChild(codeLink);
        }

        if (publication.links.project) {
            const projectLink = document.createElement('a');
            projectLink.href = publication.links.project;
            projectLink.textContent = currentLang === 'en' ? '[Project Page]' : '[项目主页]';
            links.appendChild(projectLink);
        }

        if (publication.links.poster) {
            const posterLink = document.createElement('a');
            posterLink.href = publication.links.poster;
            posterLink.textContent = currentLang === 'en' ? '[Poster]' : '[海报]';
            links.appendChild(posterLink);
        }

        content.appendChild(links);
    }

    // Assemble the publication item
    pubItem.appendChild(thumbnail);
    pubItem.appendChild(content);

    return pubItem;
}

// Modal functionality for viewing original images
function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = "block";
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    modalImg.src = imageSrc;
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
}

// Close modal when clicking outside the image
window.onclick = function (event) {
    const modal = document.getElementById('imageModal');
    if (event.target == modal) {
        closeModal();
    }
}

// Load projects from JSON file
function loadProjects() {
    fetch('projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Projects loaded successfully:", data);
            allProjects = data.projects;
            renderProjects(true);
        })
        .catch(error => {
            console.error('Error loading projects:', error);
            displayFallbackProjects();
        });
}

// Fallback if projects JSON loading fails
function displayFallbackProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = `Error loading projects.`;
}

// Toggle between showing all or selected projects
function toggleProjects() {
    showingSelectedProjects = !showingSelectedProjects;
    updateLanguage();
}

// Render projects based on selection state
function renderProjects(selectedOnly) {
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '';

    const projectsToShow = selectedOnly ?
        allProjects.filter(proj => proj.selected === 1) :
        allProjects;

    projectsToShow.forEach(project => {
        const projectElement = createProjectElement(project);
        projectsContainer.appendChild(projectElement);
    });
}

// Create HTML element for a project (similar to publication)
function createProjectElement(project) {
    const projectItem = document.createElement('div');
    projectItem.className = 'publication-item'; // Reuse publication styles

    // Create thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'pub-thumbnail';
    thumbnail.onclick = () => openModal(project.thumbnail);

    const thumbnailImg = document.createElement('img');
    thumbnailImg.src = project.thumbnail;
    thumbnailImg.alt = `${project.title} thumbnail`;
    thumbnail.appendChild(thumbnailImg);

    // Create content container
    const content = document.createElement('div');
    content.className = 'pub-content';

    // Add title
    const title = document.createElement('div');
    title.className = 'pub-title';
    title.textContent = project.title;
    content.appendChild(title);

    // Add authors with highlight
    const authors = document.createElement('div');
    authors.className = 'pub-authors';

    // Format authors with highlighting
    let authorsHTML = '';
    project.authors.forEach((author, index) => {
        if (author.includes('Daoyu Wang')) {
            authorsHTML += `<span class="highlight-name">${author}</span>`;
        } else {
            authorsHTML += author;
        }

        if (index < project.authors.length - 1) {
            authorsHTML += ', ';
        }
    });

    authors.innerHTML = authorsHTML;
    content.appendChild(authors);

    // Add venue with award if present
    const venueContainer = document.createElement('div');
    venueContainer.className = 'pub-venue-container';

    const venue = document.createElement('div');
    venue.className = 'pub-venue';
    venue.textContent = project.venue;
    venueContainer.appendChild(venue);

    // Add award if it exists
    if (project.award && project.award.length > 0) {
        const award = document.createElement('div');
        award.className = 'pub-award';
        award.textContent = project.award;
        venueContainer.appendChild(award);
    }

    content.appendChild(venueContainer);

    // Add links if they exist
    if (project.links && Object.keys(project.links).length > 0) {
        const links = document.createElement('div');
        links.className = 'pub-links';

        if (project.links.pdf) {
            const pdfLink = document.createElement('a');
            pdfLink.href = project.links.pdf;
            pdfLink.textContent = currentLang === 'en' ? '[Paper]' : '[论文]';
            links.appendChild(pdfLink);
        }

        if (project.links.code) {
            const codeLink = document.createElement('a');
            codeLink.href = project.links.code;
            codeLink.textContent = currentLang === 'en' ? '[Code]' : '[代码]';
            links.appendChild(codeLink);
        }

        if (project.links.website) {
            const websiteLink = document.createElement('a');
            websiteLink.href = project.links.website;
            websiteLink.textContent = currentLang === 'en' ? '[Project Page]' : '[项目主页]';
            links.appendChild(websiteLink);
        }

        content.appendChild(links);
    }

    // Assemble the project item
    projectItem.appendChild(thumbnail);
    projectItem.appendChild(content);

    return projectItem;
}
