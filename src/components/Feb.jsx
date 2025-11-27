import React, { useState, useEffect } from 'react';
import { X, Plus, Users, Loader, Calendar, Tag, MapPin } from 'lucide-react'; 
import './Feb.css';

const Feb = ({ isOpen, onClose, onSubmit, post }) => {
  const [tripTitle, setTripTitle] = useState('');
  const [destination, setDestination] = useState(''); // ✨ เพิ่ม state สำหรับสถานที่
  const [postText, setPostText] = useState('');
  const [images, setImages] = useState([]); 
  const [maxMembers, setMaxMembers] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // ✨ รายการหมวดหมู่การท่องเที่ยว
  const categories = [
    'ทะเล เกาะ ชายหาด',
    'ภูเขา ธรรมชาติ',
    'วัด วัฒนธรรม ประวัติศาสตร์',
    'สวนสนุก',
    'ผจญภัย Adventure',
    'เกษตร ฟาร์มสเตย์',
    'เที่ยวเมือง City Trip'
  ];

  // Get today's date in YYYY-MM-DD format for min date validation
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // ✨ Lock/Unlock body scroll เมื่อเปิด/ปิด modal
  useEffect(() => {
    if (isOpen) {
      // Lock scroll หน้าหลัก - แบบเข้มข้น
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll หน้าหลัก
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Cleanup: ปลดล็อคเมื่อ component unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (post) { 
        setTripTitle(post.title || '');
        setDestination(post.destination || ''); // ✨ โหลดสถานที่จากโพสต์
        setPostText(post.content || '');
        setMaxMembers(post.maxMembers || 10);
        setStartDate(post.startDate || '');
        setEndDate(post.endDate || '');
        setCategory(post.category || '');
        if (post.images) {
          setImages(post.images.map(url => ({ id: url, preview: url, file: null })));
        }
      } else { 
        setTripTitle('');
        setDestination(''); // ✨ รีเซ็ตสถานที่
        setPostText('');
        setImages([]);
        setMaxMembers(10);
        setStartDate('');
        setEndDate('');
        setCategory('');
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

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // ถ้าวันสิ้นสุดมีอยู่แล้ว และน้อยกว่าวันเริ่ม ให้รีเซ็ต
    if (endDate && newStartDate > endDate) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    
    // ตรวจสอบว่าวันสิ้นสุดต้องมากกว่าหรือเท่ากับวันเริ่ม
    if (startDate && newEndDate < startDate) {
      alert('วันสิ้นสุดทริปต้องไม่น้อยกว่าวันเริ่มทริป');
      return;
    }
    
    setEndDate(newEndDate);
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
    // ✨ ตรวจสอบฟิลด์บังคับ
    if (!tripTitle.trim()) {
      alert('กรุณากรอกชื่อทริป');
      return;
    }

    if (!destination.trim()) {
      alert('กรุณาระบุสถานที่ที่จะไป');
      return;
    }

    if (!category) {
      alert('กรุณาเลือกหมวดหมู่การท่องเที่ยว');
      return;
    }

    if (images.length === 0) {
      alert('กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูป');
      return;
    }

    // Validate dates
    if (startDate && !endDate) {
      alert('กรุณาระบุวันสิ้นสุดทริป');
      return;
    }

    if (!startDate && endDate) {
      alert('กรุณาระบุวันเริ่มทริป');
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
      destination: destination, // ✨ ส่งสถานที่ไปด้วย
      content: postText,
      images: imageUrls, 
      maxMembers: maxMembers,
      startDate: startDate,
      endDate: endDate,
      category: category,
    });
    
    setIsPosting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{post ? 'แก้ไขโพสต์' : 'สร้างโพสต์ใหม่'}</h2>
        
        {/* ✨ ชื่อทริป */}
        <div className="input-group">
          <label className="input-label">
            <span>ชื่อทริป</span>
            <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            className="post-input-topic"
            placeholder="ชื่อทริป"
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
          />
        </div>
        {/* รายละเอียดเพิ่มเติม */}
        <div className="input-group">
          <label className="input-label">
            <span>รายละเอียดเพิ่มเติม</span>
          </label>
          <textarea
            className="post-textarea"
            placeholder="เขียนรายละเอียดทริป กิจกรรม หรือข้อมูลเพิ่มเติม..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
        </div>


        {/* ✨ สถานที่ */}
        <div className="input-group">
          <label className="input-label">
            <MapPin size={20} />
            <span>สถานที่ที่จะไป</span>
            <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            className="post-input-destination"
            placeholder="เช่น เกาะสมุย, จังหวัดสุราษฎร์ธานี"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        

        {/* ✨ Category Selection Section */}
        <div className="category-section">
          <label className="category-label">
            <Tag size={20} />
            <span>หมวดหมู่การท่องเที่ยว</span>
            <span className="required-mark">*</span>
          </label>
          <select
            className="category-dropdown"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">-- เลือกหมวดหมู่ --</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Trip Dates Section */}
        <div className="trip-dates-section">
          <label className="trip-dates-label">
            <Calendar size={20} />
            <span>วันที่เดินทาง</span>
            <span className="required-mark">*</span>
          </label>
          
          <div className="trip-dates-inputs">
            <div className="date-input-group">
              <label className="date-label">วันเริ่มทริป</label>
              <input
                type="date"
                className="trip-date-input"
                value={startDate}
                onChange={handleStartDateChange}
                min={getTodayDate()}
              />
            </div>
            
            <div className="date-separator">→</div>
            
            <div className="date-input-group">
              <label className="date-label">วันสิ้นสุดทริป</label>
              <input
                type="date"
                className="trip-date-input"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || getTodayDate()}
                disabled={!startDate}
              />
            </div>
          </div>
          
          {startDate && endDate && (
            <p className="trip-duration-hint">
              ระยะเวลา: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} วัน
            </p>
          )}
        </div>

        {/* Max Members Section */}
        <div className="max-members-section">
          <label className="max-members-label">
            <Users size={20} />
            <span>จำนวนคนร่วมทริป</span>
          </label>
          <div className="max-members-input-group">
            <button 
              type="button"
              className="member-btn"
              onClick={() => maxMembers > 3 && setMaxMembers(maxMembers - 1)}
              disabled={maxMembers <= 3}
            >
              −
            </button>
            <input
              type="number"
              className="max-members-input"
              value={maxMembers}
              onChange={handleMaxMembersChange}
              min="3"
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

        {/* ✨ แสดงข้อความแจ้งเตือนฟิลด์ที่ขาด */}
        {(!tripTitle.trim() || !destination.trim() || !category || images.length === 0) && (
          <div className="validation-alerts">

            {images.length === 0 && (
              <div className="alert-item">⚠️ กรุณาเพิ่มรูปภาพอย่างน้อย 1 รูป</div>
            )}
          </div>
        )}

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
            เพิ่มรูปภาพ <span className="required-mark">*</span>
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
              disabled={
                isPosting || 
                images.length === 0 || 
                !tripTitle.trim() || 
                !destination.trim() || 
                !category
              }
            >
              {isPosting ? 'กำลังบันทึก...' : (post ? 'บันทึก' : 'โพสต์')}
            </button>
          </div>
        </div>
        
        {isPosting && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginTop: '10px', 
            color: '#555' 
          }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: '8px' }}>กำลังบันทึกข้อมูล...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feb;