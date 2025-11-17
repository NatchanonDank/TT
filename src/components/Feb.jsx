
import React, { useState, useEffect } from 'react';
import { X, Plus, Users, Loader } from 'lucide-react'; 
import './Feb.css';

const Feb = ({ isOpen, onClose, onSubmit, post }) => {
  const [tripTitle, setTripTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [images, setImages] = useState([]); 
  const [maxMembers, setMaxMembers] = useState(10);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (post) { 
        setTripTitle(post.title || '');
        setPostText(post.content || '');
        setMaxMembers(post.maxMembers || 10);
        if (post.images) {
          setImages(post.images.map(url => ({ id: url, preview: url, file: null })));
        }
      } else { 
        setTripTitle('');
        setPostText('');
        setImages([]);
        setMaxMembers(10);
      }
    }
  }, [post, isOpen]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map(file => {
        if (file.size > 700 * 1024) {
          alert(`รูป ${file.name} มีขนาดใหญ่เกิน 700KB! \nกรุณาเลือกรูปที่เล็กกว่านี้ครับ`);
          return null;
        }
        return {
          id: URL.createObjectURL(file),
          preview: URL.createObjectURL(file), 
          file: file 
        };
      }).filter(img => img !== null); 
      
      setImages(prev => [...prev, ...newImages].slice(0, 10));
    }
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleMaxMembersChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 3 && value <= 10) {
      setMaxMembers(value);
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result); 
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!tripTitle.trim() && !postText.trim() && images.length === 0) {
      alert('กรุณากรอกข้อมูลอย่างน้อยหนึ่งอย่าง');
      return;
    }

    setIsPosting(true);
    
    const imageUrls = [];
    try {
      const base64Promises = images.map(img => {
        if (img.file) {
          return readFileAsBase64(img.file);
        } else {
          return Promise.resolve(img.preview);
        }
      });
      
      const resolvedImageUrls = await Promise.all(base64Promises);
      imageUrls.push(...resolvedImageUrls);

    } catch (error) {
      console.error("Error converting images to Base64: ", error);
      alert("เกิดข้อผิดพลาดในการแปลงรูปภาพ");
      setIsPosting(false);
      return;
    }

    await onSubmit({
      title: tripTitle,
      content: postText,
      images: imageUrls, 
      maxMembers: maxMembers,
    });
    
    setIsPosting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{post ? 'แก้ไขโพสต์' : 'สร้างโพสต์ใหม่'}</h2>
        
        <input
          type="text"
          className="post-input-topic"
          placeholder="ชื่อทริป"
          value={tripTitle}
          onChange={(e) => setTripTitle(e.target.value)}
        />
        
        <textarea
          className="post-textarea"
          placeholder="เขียนอธิบายเพิ่มเติม"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />

        <div className="max-members-section">
          <label className="max-members-label">
            <Users size={20} />
            <span>จำนวนคนร่วมทริป</span>
          </label>
          <div className="max-members-input-group">
            <button 
              type="button"
              className="member-btn"
              onClick={() => maxMembers > 1 && setMaxMembers(maxMembers - 1)}
              disabled={maxMembers <= 1}
            >
              −
            </button>
            <input
              type="number"
              className="max-members-input"
              value={maxMembers}
              onChange={handleMaxMembersChange}
              min="1"
              max="10"
            />
            <button 
              type="button"
              className="member-btn"
              onClick={() => maxMembers < 10 && setMaxMembers(maxMembers + 1)}
              disabled={maxMembers >= 10}
            >
              +
            </button>
          </div>
          <p className="max-members-hint">กำหนดได้ 3-10 คน</p>
        </div>

        {images.length > 0 && (
          <div className={`post-image-grid layout-${images.length}`}>
            {images.map((img) => (
              <div key={img.id} className="post-image-item">
                <img src={img.preview} alt="Preview" className="post-image-preview" />
                <button className="post-remove-image" onClick={() => removeImage(img.id)}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="post-actions">
          <label className="post-upload-btn">
            <Plus size={18} />
            เพิ่มรูปภาพ
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
          </label>
          <div className="button-group">
            <button className="post-cancel-btn" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              className="post-submit-btn"
              onClick={handleSubmit}
              disabled={isPosting || images.length > 10}
            >
              {isPosting ? 'กำลังบันทึก...' : (post ? 'บันทึก' : 'โพสต์')}
            </button>
          </div>
        </div>
        
        {
        isPosting && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px', color: '#555' }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '8px' }}>กำลังบันทึกข้อมูล...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feb;