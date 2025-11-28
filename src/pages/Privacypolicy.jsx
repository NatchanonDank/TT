import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Policypage.css';

const Privacypolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-container">
      <button className="back-button" onClick={() => navigate('/register')}>
        <span>← ย้อนกลับ</span>
      </button>

      <div className="policy-content">
        <h1>นโยบายความเป็นส่วนตัว</h1>
        <p className="last-updated">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <section>
          <h2>1. ข้อมูลที่เราเก็บรวบรวม</h2>
          <p>TripTogether เก็บรวบรวมข้อมูลดังต่อไปนี้:</p>
          <ul>
            <li><strong>ข้อมูลส่วนตัว:</strong> ชื่อ, อีเมล, รูปโปรไฟล์</li>
            <li><strong>ข้อมูลการใช้งาน:</strong> โพสต์ทริป, ความคิดเห็น, การแชท, การเข้าร่วมกลุ่ม</li>
          </ul>
        </section>

        <section>
          <h2>2. การใช้ข้อมูล</h2>
          <p>เราใช้ข้อมูลของคุณเพื่อ:</p>
          <ul>
            <li>จัดการบัญชีและให้บริการแพลตฟอร์ม</li>
            <li>จับคู่ผู้ใช้ที่สนใจเดินทางร่วมกัน</li>
            <li>แสดงโพสต์และข้อมูลการเดินทางที่เกี่ยวข้อง</li>
            <li>ปรับปรุงและพัฒนาบริการ</li>
            <li>ส่งการแจ้งเตือนและข้อมูลที่สำคัญ</li>
          </ul>
        </section>

        <section>
          <h2>3. การแชร์ข้อมูล</h2>
          <p>ข้อมูลของคุณจะถูกแชร์ในกรณีต่อไปนี้:</p>
          <ul>
            <li><strong>กับสมาชิกในกลุ่ม:</strong> ชื่อ, รูปโปรไฟล์, ข้อความแชท</li>
            <li><strong>ข้อมูลสาธารณะ:</strong> โพสต์ทริป, ความคิดเห็น, รีวิว</li>
            <li><strong>ไม่มีการขายข้อมูล:</strong> เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม</li>
          </ul>
        </section>

        <section>
          <h2>4. สิทธิ์ของคุณ</h2>
          <p>คุณมีสิทธิ์ในการ:</p>
          <ul>
            <li><strong>เข้าถึง:</strong> ขอดูข้อมูลที่เราเก็บไว้</li>
            <li><strong>แก้ไข:</strong> แก้ไขข้อมูลส่วนตัวในโปรไฟล์</li>
            <li><strong>ลบ:</strong> ขอลบบัญชีและข้อมูลทั้งหมด</li>
            <li><strong>รายงาน:</strong> รายงานผู้ใช้หรือโพสต์ที่ไม่เหมาะสม</li>
          </ul>
        </section>

        <section>
          <h2>5. การเปลี่ยนแปลงนโยบาย</h2>
          <p>เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลทันทีที่เผยแพร่บนเว็บไซต์</p>
        </section>

      </div>
    </div>
  );
};

export default Privacypolicy;