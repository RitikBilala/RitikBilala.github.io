// Portfolio Data Storage (in-memory, NOT localStorage due to sandbox restrictions)
let portfolioData = {
  personal: {
    name: "Ritik Bilala",
    title: "Product Manager",
    company: "American Express",
    email: "Ritik.bilala@gmail.com",
    phone: "8291339549",
    linkedin: "https://www.linkedin.com/in/ritikbilala",
    location: "Kota, RJ"
  },
  about: "As a Product Manager at American Express, I specialize in building B2B real-time data sharing products that enable 20,000+ commercial clients to efficiently manage their expenses. With a strong foundation from IIT Bombay and 4+ years of product management experience, I combine technical expertise with strategic thinking to deliver impactful solutions.\n\nMy journey spans from technical content strategy at UpGrad to leading product initiatives at American Express, where I've launched B2B Transaction APIs, uplifted UI/UX for enterprise platforms, and expanded product portfolios. I'm passionate about leveraging data analytics, API strategy, and agile methodologies to create products that drive business value.\n\nCertified as a SAFe® 6 Agile Product Manager, I bring expertise in stakeholder management, user experience design, and data-driven decision making. My technical background in software development, machine learning, and cloud technologies enables me to bridge the gap between business needs and technical implementation.",
  experience: [
    {
      title: "Product Manager",
      company: "American Express",
      duration: "May'24-Present",
      description: "Building B2B Realtime data sharing products to enable 20k commercial clients manage their expenses",
      achievements: [
        "Launched B2B Transaction APIs, enabling commercial clients integrate with 3rd party expense management solutions",
        "Crafted turnkey digital onboarding experience for seamless data access authorization"
      ]
    },
    {
      title: "Sr. Associate Product Manager",
      company: "American Express",
      duration: "Sept'22-May'24 (1.5 Yrs)",
      description: "",
      achievements: [
        "Uplifted UI/UX of client servicing platform for 20k commercial clients",
        "Drove development of 5+ features for NextGen Data Delivery platform",
        "Expanded product portfolio with demographics file, boosting data commerce"
      ]
    },
    {
      title: "Product Analyst",
      company: "American Express",
      duration: "Apr'21-Aug'22 (1.5 Yrs)",
      description: "",
      achievements: [
        "Conducted competitor research and gap analysis for Commercial Data API strategy",
        "Built Tableau dashboard providing insights for 60k+ datafile setups & 15k+ clients",
        "Analyzed impact of India Data localization on data delivery processes"
      ]
    },
    {
      title: "Technical Content Strategist",
      company: "UpGrad Education",
      duration: "Oct'20-Apr'21 (6 Months)",
      description: "",
      achievements: [
        "Developed content for Master's in Software Engineering with DevOps specialization",
        "Created learning path covering Linux, AWS, Agile SDLC & Infrastructure as Code",
        "Developed projects for containerized Microservices deployment"
      ]
    }
  ],
  skills: [
    {
      category: "Software Development",
      items: ["HTML5, CSS, JavaScript, Bootstrap", "SQL, Hive & Yellowbricks", "AWS (EC2, S3, ECS, Load Balancers)", "Docker"]
    },
    {
      category: "ML & AI Tools",
      items: ["Python, Pandas, NumPy", "TensorFlow, Keras", "TensorFlow.js", "Web Scraping tools"]
    },
    {
      category: "Product Management",
      items: ["API Strategy & Development", "Data Analytics & Tableau", "Agile Methodologies", "User Experience Design", "Stakeholder Management"]
    }
  ],
  projects: [
    {
      title: "Flight Delay Prediction",
      category: "Machine Learning",
      duration: "Apr'20",
      description: "ML model for flight delay prediction with 80% accuracy",
      technologies: ["Python", "Logistic Regression", "Data Analysis"]
    },
    {
      title: "Parallel Programming Optimization",
      category: "High Performance Computing",
      duration: "Mar'19",
      description: "Optimized nxn Sudoku solver using OpenMP & MPI hybrid programming",
      technologies: ["OpenMP", "MPI", "C++"]
    },
    {
      title: "Real-time Image Classification",
      category: "Transfer Learning",
      duration: "Oct'20",
      description: "In-browser image classification using pretrained MobileNet",
      technologies: ["TensorFlow.js", "MobileNet", "KNN"]
    }
  ],
  education: {
    degree: "B.Tech Mechanical Engineering",
    institution: "Indian Institute of Technology Bombay",
    duration: "2016-2020",
    cpi: "8.9/10",
    minor: "Electrical Engineering Minor (9.4/10)",
    achievements: [
      "All India Rank 604 in IIT-JEE Advanced 2016 amongst 0.2 million candidates",
      "Certified SAFe® 6 Agile Product Manager"
    ]
  },
  certifications: [
    "SAFe® 6 Agile Product Manager",
    "Building and Deploying Deep Learning Applications with TensorFlow (LinkedIn)",
    "Machine Learning: Logistic Regression, Discriminant Analysis & KNN (Udemy)"
  ]
};

let viewCount = 0;
let isLoggedIn = false;
const adminPassword = "admin123";

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  renderPortfolio();
  viewCount++;
  setupEventListeners();
});

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Admin button
  document.getElementById('adminBtn').addEventListener('click', showAdminView);

  // Login form
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    if (password === adminPassword) {
      isLoggedIn = true;
      document.getElementById('adminLogin').classList.add('hidden');
      document.getElementById('adminDashboard').classList.remove('hidden');
      renderAdminDashboard();
    } else {
      alert('Incorrect password');
    }
  });

  // Admin actions
  document.getElementById('previewBtn').addEventListener('click', showPortfolioView);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('resetBtn').addEventListener('click', resetData);

  // Admin tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      switchAdminTab(targetTab);
    });
  });

  // Personal Info Form
  document.getElementById('personalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    portfolioData.personal.name = document.getElementById('editName').value;
    portfolioData.personal.title = document.getElementById('editTitle').value;
    portfolioData.personal.company = document.getElementById('editCompany').value;
    portfolioData.personal.location = document.getElementById('editLocation').value;
    portfolioData.personal.email = document.getElementById('editEmail').value;
    portfolioData.personal.phone = document.getElementById('editPhone').value;
    portfolioData.personal.linkedin = document.getElementById('editLinkedin').value;
    renderPortfolio();
    alert('Personal information updated successfully!');
  });

  // About Form
  document.getElementById('aboutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    portfolioData.about = document.getElementById('editAbout').value;
    renderPortfolio();
    alert('About section updated successfully!');
  });

  // Education Form
  document.getElementById('educationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    portfolioData.education.degree = document.getElementById('editDegree').value;
    portfolioData.education.institution = document.getElementById('editInstitution').value;
    portfolioData.education.duration = document.getElementById('editDuration').value;
    portfolioData.education.cpi = document.getElementById('editCpi').value;
    portfolioData.education.minor = document.getElementById('editMinor').value;
    const achievementsText = document.getElementById('editAchievements').value;
    portfolioData.education.achievements = achievementsText.split('\n').filter(a => a.trim());
    renderPortfolio();
    renderAdminDashboard();
    alert('Education updated successfully!');
  });

  // Add buttons
  document.getElementById('addExpBtn').addEventListener('click', () => addExperience());
  document.getElementById('addSkillBtn').addEventListener('click', () => addSkill());
  document.getElementById('addProjectBtn').addEventListener('click', () => addProject());
  document.getElementById('addCertBtn').addEventListener('click', () => addCertification());

  // Contact Form
  document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('formName').value;
    const email = document.getElementById('formEmail').value;
    const message = document.getElementById('formMessage').value;
    alert(`Thank you ${name}! Your message has been received. I'll get back to you at ${email} soon.`);
    this.reset();
  });
}

function renderPortfolio() {
  // Update hero section
  document.getElementById('heroName').textContent = portfolioData.personal.name;
  document.getElementById('heroTitle').textContent = `${portfolioData.personal.title} at ${portfolioData.personal.company}`;
  document.getElementById('heroEmail').textContent = portfolioData.personal.email;
  document.getElementById('heroEmail').href = `mailto:${portfolioData.personal.email}`;
  document.getElementById('heroPhone').textContent = portfolioData.personal.phone;
  document.getElementById('heroPhone').href = `tel:${portfolioData.personal.phone}`;
  document.getElementById('heroLinkedin').href = portfolioData.personal.linkedin;

  // Update about section
  const aboutText = document.getElementById('aboutText');
  aboutText.innerHTML = '';
  const paragraphs = portfolioData.about.split('\n\n');
  paragraphs.forEach(para => {
    if (para.trim()) {
      const p = document.createElement('p');
      p.textContent = para.trim();
      aboutText.appendChild(p);
    }
  });

  // Update experience section
  const experienceList = document.getElementById('experienceList');
  experienceList.innerHTML = '';
  portfolioData.experience.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    
    let html = `
      <div class="timeline-title">${exp.title}</div>
      <div class="timeline-company">${exp.company}</div>
      <div class="timeline-duration">${exp.duration}</div>
    `;
    
    if (exp.description) {
      html += `<p class="timeline-description">${exp.description}</p>`;
    }
    
    if (exp.achievements && exp.achievements.length > 0) {
      html += '<ul class="timeline-achievements">';
      exp.achievements.forEach(achievement => {
        html += `<li>${achievement}</li>`;
      });
      html += '</ul>';
    }
    
    item.innerHTML = html;
    experienceList.appendChild(item);
  });

  // Update skills section
  const skillsList = document.getElementById('skillsList');
  skillsList.innerHTML = '';
  portfolioData.skills.forEach(skillGroup => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    
    let html = `<h3 class="skill-title">${skillGroup.category}</h3><ul class="skill-list">`;
    skillGroup.items.forEach(skill => {
      html += `<li>${skill}</li>`;
    });
    html += '</ul>';
    
    card.innerHTML = html;
    skillsList.appendChild(card);
  });

  // Update projects section
  const projectsList = document.getElementById('projectsList');
  projectsList.innerHTML = '';
  portfolioData.projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    let html = `
      <h3 class="project-title">${project.title}</h3>
      <span class="project-category">${project.category}</span>
      <p class="project-description">${project.description}</p>
      <div class="project-tech">
    `;
    
    project.technologies.forEach(tech => {
      html += `<span class="tech-tag">${tech}</span>`;
    });
    
    html += '</div>';
    card.innerHTML = html;
    projectsList.appendChild(card);
  });

  // Update education section
  document.getElementById('eduDegree').textContent = portfolioData.education.degree;
  document.getElementById('eduInstitution').textContent = portfolioData.education.institution;
  document.getElementById('eduDuration').textContent = portfolioData.education.duration;
  document.getElementById('eduCpi').textContent = portfolioData.education.cpi;
  document.getElementById('eduMinor').textContent = portfolioData.education.minor;
  
  const eduAchievements = document.getElementById('eduAchievements');
  eduAchievements.innerHTML = '';
  portfolioData.education.achievements.forEach(achievement => {
    const li = document.createElement('li');
    li.textContent = achievement;
    eduAchievements.appendChild(li);
  });

  // Update certifications
  const certificationsList = document.getElementById('certificationsList');
  certificationsList.innerHTML = '';
  portfolioData.certifications.forEach(cert => {
    const li = document.createElement('li');
    li.textContent = cert;
    certificationsList.appendChild(li);
  });

  // Update contact section
  document.getElementById('contactEmail').textContent = portfolioData.personal.email;
  document.getElementById('contactEmail').href = `mailto:${portfolioData.personal.email}`;
  document.getElementById('contactPhone').textContent = portfolioData.personal.phone;
  document.getElementById('contactPhone').href = `tel:${portfolioData.personal.phone}`;
  document.getElementById('contactLinkedin').href = portfolioData.personal.linkedin;
  document.getElementById('contactLocation').textContent = portfolioData.personal.location;
}

function showAdminView() {
  document.getElementById('portfolioView').classList.add('hidden');
  document.getElementById('adminView').classList.remove('hidden');
  document.getElementById('mainNav').classList.add('hidden');
  
  if (!isLoggedIn) {
    document.getElementById('adminLogin').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
  } else {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
    renderAdminDashboard();
  }
}

function showPortfolioView() {
  document.getElementById('portfolioView').classList.remove('hidden');
  document.getElementById('adminView').classList.add('hidden');
  document.getElementById('mainNav').classList.remove('hidden');
}

function logout() {
  isLoggedIn = false;
  showPortfolioView();
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.admin-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
}

function renderAdminDashboard() {
  // Update dashboard stats
  document.getElementById('viewCount').textContent = viewCount;
  document.getElementById('expCount').textContent = portfolioData.experience.length;
  document.getElementById('projCount').textContent = portfolioData.projects.length;
  
  let totalSkills = 0;
  portfolioData.skills.forEach(group => {
    totalSkills += group.items.length;
  });
  document.getElementById('skillCount').textContent = totalSkills;

  // Load personal info form
  document.getElementById('editName').value = portfolioData.personal.name;
  document.getElementById('editTitle').value = portfolioData.personal.title;
  document.getElementById('editCompany').value = portfolioData.personal.company;
  document.getElementById('editLocation').value = portfolioData.personal.location;
  document.getElementById('editEmail').value = portfolioData.personal.email;
  document.getElementById('editPhone').value = portfolioData.personal.phone;
  document.getElementById('editLinkedin').value = portfolioData.personal.linkedin;

  // Load about form
  document.getElementById('editAbout').value = portfolioData.about;

  // Load education form
  document.getElementById('editDegree').value = portfolioData.education.degree;
  document.getElementById('editInstitution').value = portfolioData.education.institution;
  document.getElementById('editDuration').value = portfolioData.education.duration;
  document.getElementById('editCpi').value = portfolioData.education.cpi;
  document.getElementById('editMinor').value = portfolioData.education.minor;
  document.getElementById('editAchievements').value = portfolioData.education.achievements.join('\n');

  // Render managers
  renderExperienceManager();
  renderSkillsManager();
  renderProjectsManager();
  renderCertificationsManager();
}

function renderExperienceManager() {
  const container = document.getElementById('experienceManager');
  container.innerHTML = '';
  
  portfolioData.experience.forEach((exp, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-header">
        <div class="item-title">${exp.title} - ${exp.company}</div>
        <div class="item-actions">
          <button class="btn btn--secondary btn--sm" onclick="editExperience(${index})">Edit</button>
          <button class="btn btn--outline btn--sm" onclick="deleteExperience(${index})">Delete</button>
        </div>
      </div>
      <div class="item-content">
        <p><strong>Duration:</strong> ${exp.duration}</p>
        ${exp.description ? `<p><strong>Description:</strong> ${exp.description}</p>` : ''}
        ${exp.achievements.length > 0 ? `<p><strong>Achievements:</strong> ${exp.achievements.length} items</p>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function addExperience() {
  const title = prompt('Job Title:');
  if (!title) return;
  
  const company = prompt('Company:');
  if (!company) return;
  
  const duration = prompt('Duration (e.g., Jan 2020 - Dec 2021):');
  if (!duration) return;
  
  const description = prompt('Description (optional):') || '';
  const achievementsText = prompt('Achievements (separate with | character):') || '';
  const achievements = achievementsText.split('|').map(a => a.trim()).filter(a => a);
  
  portfolioData.experience.push({
    title,
    company,
    duration,
    description,
    achievements
  });
  
  renderExperienceManager();
  renderPortfolio();
  renderAdminDashboard();
}

function editExperience(index) {
  const exp = portfolioData.experience[index];
  
  const title = prompt('Job Title:', exp.title);
  if (title === null) return;
  
  const company = prompt('Company:', exp.company);
  if (company === null) return;
  
  const duration = prompt('Duration:', exp.duration);
  if (duration === null) return;
  
  const description = prompt('Description:', exp.description) || '';
  const achievementsText = prompt('Achievements (separate with | character):', exp.achievements.join(' | ')) || '';
  const achievements = achievementsText.split('|').map(a => a.trim()).filter(a => a);
  
  portfolioData.experience[index] = {
    title,
    company,
    duration,
    description,
    achievements
  };
  
  renderExperienceManager();
  renderPortfolio();
  renderAdminDashboard();
}

function deleteExperience(index) {
  if (confirm('Are you sure you want to delete this experience?')) {
    portfolioData.experience.splice(index, 1);
    renderExperienceManager();
    renderPortfolio();
    renderAdminDashboard();
  }
}

function renderSkillsManager() {
  const container = document.getElementById('skillsManager');
  container.innerHTML = '';
  
  portfolioData.skills.forEach((skillGroup, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-header">
        <div class="item-title">${skillGroup.category}</div>
        <div class="item-actions">
          <button class="btn btn--secondary btn--sm" onclick="editSkill(${index})">Edit</button>
          <button class="btn btn--outline btn--sm" onclick="deleteSkill(${index})">Delete</button>
        </div>
      </div>
      <div class="item-content">
        <p><strong>Skills:</strong> ${skillGroup.items.length} items</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function addSkill() {
  const category = prompt('Skill Category:');
  if (!category) return;
  
  const itemsText = prompt('Skills (separate with | character):');
  if (!itemsText) return;
  
  const items = itemsText.split('|').map(s => s.trim()).filter(s => s);
  
  portfolioData.skills.push({ category, items });
  
  renderSkillsManager();
  renderPortfolio();
  renderAdminDashboard();
}

function editSkill(index) {
  const skillGroup = portfolioData.skills[index];
  
  const category = prompt('Skill Category:', skillGroup.category);
  if (category === null) return;
  
  const itemsText = prompt('Skills (separate with | character):', skillGroup.items.join(' | '));
  if (itemsText === null) return;
  
  const items = itemsText.split('|').map(s => s.trim()).filter(s => s);
  
  portfolioData.skills[index] = { category, items };
  
  renderSkillsManager();
  renderPortfolio();
  renderAdminDashboard();
}

function deleteSkill(index) {
  if (confirm('Are you sure you want to delete this skill category?')) {
    portfolioData.skills.splice(index, 1);
    renderSkillsManager();
    renderPortfolio();
    renderAdminDashboard();
  }
}

function renderProjectsManager() {
  const container = document.getElementById('projectsManager');
  container.innerHTML = '';
  
  portfolioData.projects.forEach((project, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-header">
        <div class="item-title">${project.title}</div>
        <div class="item-actions">
          <button class="btn btn--secondary btn--sm" onclick="editProject(${index})">Edit</button>
          <button class="btn btn--outline btn--sm" onclick="deleteProject(${index})">Delete</button>
        </div>
      </div>
      <div class="item-content">
        <p><strong>Category:</strong> ${project.category}</p>
        <p><strong>Description:</strong> ${project.description}</p>
        <p><strong>Technologies:</strong> ${project.technologies.join(', ')}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function addProject() {
  const title = prompt('Project Title:');
  if (!title) return;
  
  const category = prompt('Category:');
  if (!category) return;
  
  const duration = prompt('Duration (e.g., Apr 2020):');
  if (!duration) return;
  
  const description = prompt('Description:');
  if (!description) return;
  
  const techText = prompt('Technologies (separate with | character):');
  if (!techText) return;
  
  const technologies = techText.split('|').map(t => t.trim()).filter(t => t);
  
  portfolioData.projects.push({
    title,
    category,
    duration,
    description,
    technologies
  });
  
  renderProjectsManager();
  renderPortfolio();
  renderAdminDashboard();
}

function editProject(index) {
  const project = portfolioData.projects[index];
  
  const title = prompt('Project Title:', project.title);
  if (title === null) return;
  
  const category = prompt('Category:', project.category);
  if (category === null) return;
  
  const duration = prompt('Duration:', project.duration);
  if (duration === null) return;
  
  const description = prompt('Description:', project.description);
  if (description === null) return;
  
  const techText = prompt('Technologies (separate with | character):', project.technologies.join(' | '));
  if (techText === null) return;
  
  const technologies = techText.split('|').map(t => t.trim()).filter(t => t);
  
  portfolioData.projects[index] = {
    title,
    category,
    duration,
    description,
    technologies
  };
  
  renderProjectsManager();
  renderPortfolio();
  renderAdminDashboard();
}

function deleteProject(index) {
  if (confirm('Are you sure you want to delete this project?')) {
    portfolioData.projects.splice(index, 1);
    renderProjectsManager();
    renderPortfolio();
    renderAdminDashboard();
  }
}

function renderCertificationsManager() {
  const container = document.getElementById('certificationsManager');
  container.innerHTML = '';
  
  portfolioData.certifications.forEach((cert, index) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-header">
        <div class="item-title">${cert}</div>
        <div class="item-actions">
          <button class="btn btn--secondary btn--sm" onclick="editCertification(${index})">Edit</button>
          <button class="btn btn--outline btn--sm" onclick="deleteCertification(${index})">Delete</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addCertification() {
  const cert = prompt('Certification Name:');
  if (cert) {
    portfolioData.certifications.push(cert);
    renderCertificationsManager();
    renderPortfolio();
  }
}

function editCertification(index) {
  const cert = prompt('Certification Name:', portfolioData.certifications[index]);
  if (cert !== null) {
    portfolioData.certifications[index] = cert;
    renderCertificationsManager();
    renderPortfolio();
  }
}

function deleteCertification(index) {
  if (confirm('Are you sure you want to delete this certification?')) {
    portfolioData.certifications.splice(index, 1);
    renderCertificationsManager();
    renderPortfolio();
  }
}

function exportData() {
  const dataStr = JSON.stringify(portfolioData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'portfolio-data.json';
  link.click();
  URL.revokeObjectURL(url);
  alert('Portfolio data exported successfully!');
}

function resetData() {
  if (confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
    location.reload();
  }
}