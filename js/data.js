// Update portfolio content in this file.
export const DATA = {
  name: "NEIL IVAN V. TANAMOR",
  role: "Information Technology Graduate",
  tagline: "An Information Technology graduate. I bring practical problem-solving, clear communication, and a commitment to learning.",
  resumeUrl: "assets/documents/Neil_Ivan_Tanamor.pdf",
  profileImage: "assets/images/profile.jpg",
  profileIllustration: "assets/images/profile-illustrated.png",
  profileImageAlt: "Portrait of NEIL IVAN V. TANAMOR",
  about: [
    "I’m a Software Engineer focused on building smart, user-friendly, and impactful digital solutions. I combine technical expertise, problem-solving, and UI/UX thinking to turn ideas into clean and efficient experiences.",
    "I’m passionate about learning, innovation, and continuous improvement, and I enjoy solving real-world challenges through technology. Whether working independently or with a team, I bring a results-driven mindset, attention to detail, and a commitment to delivering quality work.",
    "Let’s build something meaningful together."
  ],
  skills: [
    {
      group: "frontend development",
      items: [
        { name: "HTML", logo: "</>", icon: "https://cdn.simpleicons.org/html5/E34F26", color: "#E34F26" },
        { name: "CSS", logo: "CSS", icon: "https://cdn.simpleicons.org/css/1572B6", color: "#1572B6" },
        { name: "JavaScript", logo: "JS", icon: "https://cdn.simpleicons.org/javascript/F7DF1E", color: "#F7DF1E" },
        { name: "React", logo: "R", icon: "https://cdn.simpleicons.org/react/61DAFB", color: "#61DAFB" },
        { name: "Tailwind CSS", logo: "TW", icon: "https://cdn.simpleicons.org/tailwindcss/06B6D4", color: "#06B6D4" }
      ]
    },
    {
      group: "backend development",
      items: [
        { name: "Node.js", logo: "N", icon: "https://cdn.simpleicons.org/nodedotjs/5FA04E", color: "#5FA04E" },
        { name: "Express.js", logo: "EX", icon: "https://cdn.simpleicons.org/express/F2F3EF", color: "#F2F3EF" }
      ]
    },
    {
      group: "database",
      items: [
        { name: "MySQL", logo: "MY", icon: "https://cdn.simpleicons.org/mysql/4479A1", color: "#4479A1" },
        { name: "MongoDB", logo: "MG", icon: "https://cdn.simpleicons.org/mongodb/47A248", color: "#47A248" },
        { name: "Firebase", logo: "FB", icon: "https://cdn.simpleicons.org/firebase/DD2C00", color: "#DD2C00" }
      ]
    }
  ],
  projects: [
    {
      name: "Bachelor of Science in Information Technology",
      url: "#",
      stat: "education / July 2026",
      desc: "Specialization in Service Management at Batangas State University - TNEU Malvar Campus.",
      tags: ["BSIT", "Service Management"]
    },
    {
      name: "Information and Communication Technology",
      url: "#",
      stat: "education / May 2020",
      desc: "Malvar Senior High School - awarded with honors.",
      tags: ["ICT", "With Honors"]
    },
    {
      name: "Lean Six Sigma Certified",
      url: "#",
      stat: "certification / White Belt",
      desc: "A foundational credential in quality and process-improvement principles.",
      tags: ["Lean Six Sigma", "Quality"]
    },
    {
      name: "Databiz 2024 and BITCON 2024",
      url: "#",
      stat: "professional development",
      desc: "Professional-development credentials listed in my resume.",
      tags: ["Databiz", "BITCON"]
    }
  ],
  experience: [
    {
      id: "handyhome",
      label: "live web project",
      title: "HandyHome",
      description: "On-demand household services and booking platform.",
      role: "Full-Stack Developer",
      technologies: ["React", "Ionic", "Node.js", "Firebase"],
      focus: [],
      features: [
        "Service booking",
        "Authentication",
        "Booking-status tracking",
        "Admin dashboard"
      ],
      links: {
        live: "https://handyhomebatangas.com/pages/auth/login",
        github: ""
      },
      visuals: {
        desktop: {
          src: "assets/images/projects/handyhome/admin-dashboard.png",
          alt: "HandyHome admin dashboard showing analytics and management options.",
          fit: "contain"
        },
        mobile: {
          src: "assets/images/projects/handyhome/login-screen.png",
          alt: "HandyHome user sign-in screen.",
          fit: "cover"
        }
      },
      placeholder: {
        kind: "service",
        eyebrow: "HandyHome",
        title: "Book help, simply.",
        metrics: ["Trusted workers", "Live bookings"]
      }
    },
    {
      id: "parkbased",
      label: "web application",
      title: "ParkBased",
      description: "A parking-reservation platform designed to help drivers find, reserve, and manage spaces with less hassle.",
      role: "Web Application Developer",
      technologies: [],
      focus: ["Reservations", "Account flow", "Responsive UI"],
      features: [
        "Parking-space discovery",
        "Reservation workflow",
        "Vehicle details",
        "Account registration"
      ],
      links: {
        live: "",
        github: ""
      },
      visuals: {
        desktop: {
          src: "assets/images/projects/parkbased/landing-dashboard.png",
          alt: "ParkBased landing page showing a parking-reservation call to action and user statistics.",
          fit: "contain"
        },
        mobile: null
      },
      placeholder: {
        kind: "parking",
        eyebrow: "ParkBased",
        title: "Your space is ready.",
        metrics: ["B-12", "09:30 AM"]
      }
    }
  ],
  contact: {
    email: "neilvanromanat@gmail.com",
    phone: "+63 945 678 6282",
    location: "Malvar, Batangas, Philippines"
  }
};
