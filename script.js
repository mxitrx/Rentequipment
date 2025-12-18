document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // 1. จัดการตัวเลขบนปุ่มรถเข็น (Cart Badge)
    // ============================================
    
    // ฟังก์ชันคำนวณและแสดงตัวเลข
    function updateCartCount() {
        const cartCountElement = document.getElementById('cart-count'); // ไอคอนบน Navbar
        const navCartBadge = document.getElementById('nav-cart-count'); // ไอคอนแบบ Badge (ถ้ามี)
        
        // ดึงข้อมูลจาก LocalStorage
        const cart = JSON.parse(localStorage.getItem('pixelmotion_cart')) || [];
        
        // คำนวณผลรวมจำนวนชิ้น (Sum Quantity)
        const totalItems = cart.reduce((sum, item) => sum + parseInt(item.qty || 1), 0);
        
        // อัปเดตตัวเลขใน HTML
        if (cartCountElement) cartCountElement.textContent = totalItems;
        if (navCartBadge) {
            navCartBadge.textContent = totalItems;
            navCartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }

    // เรียกทำงานทันทีเมื่อเปิดหน้าเว็บ
    updateCartCount();

    // ============================================
    // 2. จัดการ Modal และการจอง (หน้า Inventory/Index)
    // ============================================
    const modal = document.getElementById('inventoryModal');
    
    // ถ้าหน้านี้มี Modal (คือหน้า Index หรือ Inventory) ให้ทำงานส่วนนี้
    if (modal) {
        const closeBtn = document.querySelector('.modal-close-btn');
        const cards = document.querySelectorAll('.item-card');
        
        // Elements ใน Modal
        const modalImg = document.getElementById('modal-img');
        const modalCode = document.getElementById('modal-code');
        const modalTitle = document.getElementById('modal-title');
        const modalStatusPill = document.getElementById('modal-status-pill');
        const modalItemsList = document.getElementById('modal-items-list');
        const modalStock = document.getElementById('modal-stock'); // เพิ่มส่วนแสดง Stock
        
        // สร้างปุ่มจองใน Modal (ถ้ายังไม่มีใน HTML)
        let bookBtn = document.querySelector('.modal-actions button');
        if(!bookBtn && document.querySelector('.modal-content-col')) {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'modal-actions';
            actionDiv.innerHTML = '<button class="btn-primary full-width" style="margin-top:20px;">จองอุปกรณ์นี้</button>';
            document.querySelector('.modal-content-col').appendChild(actionDiv);
            bookBtn = actionDiv.querySelector('button');
        }

        let currentProduct = null;

        const openModal = (card) => {
            const data = card.dataset;
            // ดึงรูปภาพ (รองรับโครงสร้าง HTML หลายแบบ)
            const imgElement = card.querySelector('img') || card.querySelector('.card-image-container img');
            const imgSrc = imgElement ? imgElement.src : '';
            
            // ดึงราคา (ถ้ามี)
            let priceVal = 0;
            const priceTag = card.querySelector('.price-tag');
            if(priceTag) {
                priceVal = parseInt(priceTag.innerText.replace(/[^0-9]/g, '')) || 0;
            }

            currentProduct = {
                code: data.code,
                name: data.title,
                price: priceVal, // ถ้าไม่มีราคาให้เป็น 0 หรือใส่ราคาเริ่มต้น
                image: imgSrc,
                qty: 1,
                items: data.items || '-'
            };

            // แสดงข้อมูล
            if(modalImg) modalImg.src = imgSrc;
            if(modalCode) modalCode.textContent = data.code;
            if(modalTitle) modalTitle.textContent = data.title;
            if(modalStock) modalStock.textContent = data.stock || '-';

            // Status Pill
            if(modalStatusPill) {
                modalStatusPill.className = 'status-pill'; 
                if(data.status === 'available') {
                    modalStatusPill.classList.add('st-available');
                    modalStatusPill.textContent = 'Available';
                    if(bookBtn) { bookBtn.disabled = false; bookBtn.textContent = 'จองอุปกรณ์นี้'; }
                } else if (data.status === 'low') {
                    modalStatusPill.classList.add('st-low');
                    modalStatusPill.textContent = 'Low Stock';
                    if(bookBtn) { bookBtn.disabled = false; bookBtn.textContent = 'จองอุปกรณ์นี้'; }
                } else {
                    modalStatusPill.classList.add('st-out');
                    modalStatusPill.textContent = 'Out of Stock';
                    if(bookBtn) { bookBtn.disabled = true; bookBtn.textContent = 'สินค้าหมดชั่วคราว'; }
                }
            }

            // List Items
            if(modalItemsList) {
                modalItemsList.innerHTML = ''; 
                if (data.items) {
                    data.items.split(',').forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item.trim();
                        modalItemsList.appendChild(li);
                    });
                }
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const addToCart = () => {
            if (!currentProduct) return;
            let cart = JSON.parse(localStorage.getItem('pixelmotion_cart')) || [];
            
            // เช็คของซ้ำ
            const existingItem = cart.find(item => item.code === currentProduct.code);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push(currentProduct);
            }

            localStorage.setItem('pixelmotion_cart', JSON.stringify(cart));
            
            // **สำคัญ: อัปเดตเลขทันทีหลังจากกดจอง**
            updateCartCount();
            
            // ปิด Modal และไปหน้าตะกร้า
            modal.classList.remove('active');
            document.body.style.overflow = '';
            window.location.href = 'cart.html';
        };

        // Event Listeners
        cards.forEach(card => card.addEventListener('click', () => openModal(card)));
        if(closeBtn) closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
        if(bookBtn) bookBtn.addEventListener('click', addToCart);
        
        window.onclick = (e) => {
            if (e.target == modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
    }

    // ประกาศฟังก์ชันนี้ไว้ข้างนอก เพื่อให้หน้าอื่น (เช่น payment.html) เรียกใช้ได้
window.updateCartBadge = function() {
    const badge = document.getElementById('nav-cart-count'); // ไอคอน Badge สีแดง
    const cartCountElement = document.getElementById('cart-count'); // ตัวเลขแบบ Text (ถ้ามี)
    
    // ดึงข้อมูลจาก LocalStorage
    const cart = JSON.parse(localStorage.getItem('pixelmotion_cart')) || [];
    
    // คำนวณผลรวมจำนวนชิ้น
    const totalItems = cart.reduce((sum, item) => sum + parseInt(item.qty || 1), 0);
    
    // อัปเดตตัวเลข
    if (badge) {
        badge.textContent = totalItems;
        // ซ่อน Badge ถ้าไม่มีของ, แสดงถ้ามีของ
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        
        // เพิ่ม Effect เด้งดึ๋ง
        badge.classList.remove('pop');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('pop');
    }
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. เรียกอัปเดตตัวเลขทันทีที่โหลดหน้าเว็บ
    window.updateCartBadge();

    // 2. จัดการ Modal และการจอง (ทำงานเฉพาะหน้าที่มี Modal เช่น index.html, inventory.html)
    const modal = document.getElementById('inventoryModal');
    
    if (modal) {
        const closeBtn = document.querySelector('.modal-close-btn');
        const cards = document.querySelectorAll('.item-card');
        
        // Elements ภายใน Modal
        const modalImg = document.getElementById('modal-img');
        const modalCode = document.getElementById('modal-code');
        const modalTitle = document.getElementById('modal-title');
        const modalStatusPill = document.getElementById('modal-status-pill');
        const modalItemsList = document.getElementById('modal-items-list');
        const modalStock = document.getElementById('modal-stock');
        
        // สร้างปุ่มจอง (ถ้ายังไม่มี)
        let bookBtn = document.querySelector('.modal-actions button');
        if(!bookBtn && document.querySelector('.modal-content-col')) {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'modal-actions';
            actionDiv.innerHTML = '<button class="btn-primary full-width" style="margin-top:20px;">จองอุปกรณ์นี้</button>';
            document.querySelector('.modal-content-col').appendChild(actionDiv);
            bookBtn = actionDiv.querySelector('button');
        }

        let currentProduct = null;

        const openModal = (card) => {
            const data = card.dataset;
            const imgElement = card.querySelector('img') || card.querySelector('.card-image-container img');
            const imgSrc = imgElement ? imgElement.src : '';
            
            // ดึงราคา
            let priceVal = 0;
            const priceTag = card.querySelector('.price-tag');
            if(priceTag) {
                priceVal = parseInt(priceTag.innerText.replace(/[^0-9]/g, '')) || 0;
            }

            currentProduct = {
                code: data.code,
                name: data.title,
                price: priceVal,
                image: imgSrc,
                qty: 1,
                items: data.items || '-'
            };

            // ใส่ข้อมูลลง Modal
            if(modalImg) modalImg.src = imgSrc;
            if(modalCode) modalCode.textContent = data.code;
            if(modalTitle) modalTitle.textContent = data.title;
            if(modalStock) modalStock.textContent = data.stock || '-';

            // จัดการ Status
            if(modalStatusPill) {
                modalStatusPill.className = 'status-pill'; 
                if(data.status === 'available') {
                    modalStatusPill.classList.add('st-available');
                    modalStatusPill.textContent = 'Available';
                    if(bookBtn) { bookBtn.disabled = false; bookBtn.textContent = 'จองอุปกรณ์นี้'; }
                } else if (data.status === 'low') {
                    modalStatusPill.classList.add('st-low');
                    modalStatusPill.textContent = 'Low Stock';
                    if(bookBtn) { bookBtn.disabled = false; bookBtn.textContent = 'จองอุปกรณ์นี้'; }
                } else {
                    modalStatusPill.classList.add('st-out');
                    modalStatusPill.textContent = 'Out of Stock';
                    if(bookBtn) { bookBtn.disabled = true; bookBtn.textContent = 'สินค้าหมดชั่วคราว'; }
                }
            }

            // จัดการรายการของในชุด
            if(modalItemsList) {
                modalItemsList.innerHTML = ''; 
                if (data.items) {
                    data.items.split(',').forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item.trim();
                        modalItemsList.appendChild(li);
                    });
                }
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const addToCart = () => {
            if (!currentProduct) return;
            let cart = JSON.parse(localStorage.getItem('pixelmotion_cart')) || [];
            
            const existingItem = cart.find(item => item.code === currentProduct.code);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push(currentProduct);
            }

            localStorage.setItem('pixelmotion_cart', JSON.stringify(cart));
            
            // อัปเดตตัวเลขทันที
            window.updateCartBadge();
            
            // ไปหน้าตะกร้า
            modal.classList.remove('active');
            document.body.style.overflow = '';
            window.location.href = 'cart.html';
        };

        // Events
        cards.forEach(card => card.addEventListener('click', () => openModal(card)));
        if(closeBtn) closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
        if(bookBtn) bookBtn.addEventListener('click', addToCart);
        
        window.onclick = (e) => {
            if (e.target == modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
    }
});
});