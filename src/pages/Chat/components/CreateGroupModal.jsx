import React from 'react';
import { X, Upload } from 'lucide-react';

const CreateGroupModal = ({ 
  isOpen, 
  groupName,
  maxMembers,
  avatarPreview,
  onClose, 
  onNameChange,
  onMaxMembersChange,
  onAvatarUpload, 
  onCreateGroup 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>สร้างกลุ่มใหม่</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <label className="input-label">ชื่อกลุ่ม</label>
          <input
            type="text"
            placeholder="เช่น เที่ยวเหนือ 2025"
            value={groupName}
            onChange={(e) => onNameChange(e.target.value)}
            className="modal-input"
          />

          <label className="input-label">จำนวนสมาชิกสูงสุด</label>
          <input
            type="number"
            min="2"
            max="10"
            placeholder="10"
            value={maxMembers}
            onChange={(e) => onMaxMembersChange(e.target.value)}
            className="modal-input"
          />

          <label className="input-label">เลือกรูปภาพกลุ่ม</label>
          <div className="avatar-upload">
            {avatarPreview && (
              <img src={avatarPreview} alt="preview" className="avatar-preview" />
            )}
            <label htmlFor="avatar-upload" className="upload-btn">
              <Upload size={16} />
              <span>อัปโหลดรูป</span>
            </label>
            <input
              type="file"
              accept="image/*"
              id="avatar-upload"
              onChange={onAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button 
            className="create-btn" 
            onClick={onCreateGroup} 
            disabled={!groupName.trim()}
          >
            สร้างกลุ่ม
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;