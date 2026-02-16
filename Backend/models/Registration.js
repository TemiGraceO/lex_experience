const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true,
    unique: true 
  },
  school: { 
    type: String, 
    required: true,
    enum: ['yes', 'no'] 
  },
  idCardFileName: { 
    type: String, 
    default: 'N/A' 
  },
  interest: { 
    type: String, 
    default: '' 
  },
  ticketType: { 
    type: String, 
    required: true,
    enum: ['ABU Student', 'Non-ABU'] 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'],
    default: 'pending' 
  },
  paymentReference: { 
    type: String, 
    default: null 
  },
  paidAt: { 
    type: Date, 
    default: null 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create index for faster queries
registrationSchema.index({ email: 1 });
registrationSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Registration', registrationSchema);