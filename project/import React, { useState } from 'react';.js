import React, { useState } from 'react';
import './StudentGallery.css'; // External CSS for styling

const projectImages = [
  { id: 1, src: '/images/project1.jpg', alt: 'Project 1' },
  { id: 2, src: '/images/project2.jpg', alt: 'Project 2' },
  { id: 3, src: '/images/project3.jpg', alt: 'Project 3' },
  { id: 4, src: '/images/project4.jpg', alt: 'Project 4' },
  // Add more images as needed
];

export default function StudentGallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="gallery-container">
      <h2>Student Project Gallery</h2>
      <div className="image-grid">
        {projectImages.map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt={img.alt}
            className="gallery-image"
            onClick={() => setSelectedImage(img)}
          />
        ))}
      </div>

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <span className="close">&times;</span>
          <img className="modal-content" src={selectedImage.src} alt={selectedImage.alt} />
          <div className="caption">{selectedImage.alt}</div>
        </div>
      )}
    </div>
  );
}