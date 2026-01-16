// Node.js script to generate extension icons
// Requires: npm install canvas
// Run: node create-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background - Monday.com blue gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#0073ea');
    gradient.addColorStop(1, '#005bb5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw database/CRM icon
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = Math.max(1, size / 32);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.25;
    const spacing = size * 0.15;
    
    // Top cylinder
    ctx.beginPath();
    ctx.arc(centerX, centerY - spacing, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle cylinder
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bottom cylinder
    ctx.beginPath();
    ctx.arc(centerX, centerY + spacing, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add extraction arrow
    const arrowSize = size * 0.15;
    const arrowX = size * 0.75;
    const arrowY = centerY;
    
    ctx.beginPath();
    ctx.moveTo(arrowX - arrowSize, arrowY - arrowSize/2);
    ctx.lineTo(arrowX, arrowY);
    ctx.lineTo(arrowX - arrowSize, arrowY + arrowSize/2);
    ctx.lineWidth = Math.max(2, size / 16);
    ctx.stroke();
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Created ${filename} (${size}x${size})`);
}

// Create all three icon sizes
console.log('🎨 Generating extension icons...\n');
createIcon(16, 'icon16.png');
createIcon(48, 'icon48.png');
createIcon(128, 'icon128.png');
console.log('\n✨ All icons created successfully!');

