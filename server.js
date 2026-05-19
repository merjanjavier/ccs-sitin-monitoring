const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const { dbHelpers, db } = require('./database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Routes

// Health / Diagnostics Endpoint
app.get('/api/health', async (req, res) => {
  const report = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      configuredUrl: process.env.TURSO_DATABASE_URL ? 'Configured' : 'Missing',
      configuredToken: process.env.TURSO_AUTH_TOKEN ? 'Configured' : 'Missing',
      connection: 'Unknown'
    }
  };
  
  try {
    await db.execute('SELECT 1');
    report.database.connection = 'Successful';
  } catch (error) {
    report.status = 'unhealthy';
    report.database.connection = 'Failed';
    report.database.error = error.message;
  }
  
  res.json(report);
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { idNumber, lastname, firstname, middlename, courseLevel, course, address, email, password, confirmPassword } = req.body;

    // Validation
    if (!idNumber || !lastname || !firstname || !courseLevel || !course || !address || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Check if user already exists
    const existingUserByIdNumber = await dbHelpers.getUserByIdNumber(idNumber);
    if (existingUserByIdNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Number already registered' 
      });
    }

    const existingUserByEmail = await dbHelpers.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      idNumber,
      lastname,
      firstname,
      middlename: middlename || '',
      courseLevel,
      course,
      address,
      email,
      password: hashedPassword
    };

    const result = await dbHelpers.createUser(userData);

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful',
      userId: result.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});


// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { idNumber, password } = req.body;

    // Validation
    if (!idNumber || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Number and password are required' 
      });
    }

    // Check if it's admin login
    if (idNumber === 'admin001') {
      const admin = await dbHelpers.getAdminByUsername(idNumber);
      
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid admin credentials' 
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid admin credentials' 
        });
      }

      // Generate JWT token for admin
      const token = jwt.sign(
        { 
          userId: admin.id, 
          username: admin.username,
          isAdmin: true
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      return res.json({ 
        success: true, 
        message: 'Admin login successful',
        token,
        isAdmin: true,
        user: {
          id: admin.id,
          username: admin.username
        }
      });
    }

    // Regular user login
    // Get user from database
    const user = await dbHelpers.getUserByIdNumber(idNumber);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ID Number or password' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ID Number or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        idNumber: user.id_number,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    // Return user data (without password)
    res.json({ 
      success: true, 
      message: 'Login successful',
      token,
      isAdmin: false,
      user: {
        id: user.id,
        idNumber: user.id_number,
        lastname: user.lastname,
        firstname: user.firstname,
        middlename: user.middlename,
        courseLevel: user.course_level,
        course: user.course,
        address: user.address,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get all users (for testing/admin purposes)
app.get('/api/users', async (req, res) => {
  try {
    const users = await dbHelpers.getAllUsers();
    res.json({ 
      success: true, 
      users 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching users' 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbHelpers.getUserByIdNumber(req.user.idNumber);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        idNumber: user.id_number,
        lastname: user.lastname,
        firstname: user.firstname,
        middlename: user.middlename,
        courseLevel: user.course_level,
        course: user.course,
        address: user.address,
        email: user.email,
        photo: user.photo
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching profile' 
    });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstname, lastname, middlename, course, courseLevel, address, email, photo } = req.body;
    
    // Validation
    if (!firstname || !lastname || !course || !courseLevel || !address || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }

    const userId = req.user.userId;
    const result = await dbHelpers.updateUser(userId, {
      firstname,
      lastname,
      middlename: middlename || '',
      course,
      courseLevel,
      address,
      email,
      photo: photo || null
    });

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile' 
    });
  }
});

// Admin middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    req.user = user;
    next();
  });
};

// Get all announcements (public - for user profile)
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await dbHelpers.getAllAnnouncements();
    res.json({ 
      success: true, 
      announcements 
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching announcements' 
    });
  }
});

// Get admin statistics
app.get('/api/admin/statistics', authenticateAdmin, async (req, res) => {
  try {
    const stats = await dbHelpers.getStatistics();
    const analytics = await dbHelpers.getAnalytics();
    res.json({ 
      success: true, 
      statistics: {
        ...stats,
        mostUsedLab: analytics.mostUsedLab,
        mostUsedPurpose: analytics.mostUsedPurpose
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching statistics' 
    });
  }
});

// Get all announcements
app.get('/api/admin/announcements', authenticateAdmin, async (req, res) => {
  try {
    const announcements = await dbHelpers.getAllAnnouncements();
    res.json({ 
      success: true, 
      announcements 
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching announcements' 
    });
  }
});

// Create announcement (admin only)
app.post('/api/admin/announcements', authenticateAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }

    const result = await dbHelpers.createAnnouncement(title, content);

    res.status(201).json({ 
      success: true, 
      message: 'Announcement created successfully',
      announcementId: result.id
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating announcement' 
    });
  }
});

// Delete announcement (admin only)
app.delete('/api/admin/announcements/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbHelpers.deleteAnnouncement(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'Server error deleting announcement' });
  }
});

// Get all students (admin)
app.get('/api/admin/students', authenticateAdmin, async (req, res) => {
  try {
    const students = await dbHelpers.getAllStudents();
    res.json({ 
      success: true, 
      students 
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching students' 
    });
  }
});

// Get student by ID number (admin)
app.get('/api/admin/students/:idNumber', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber } = req.params;
    const student = await dbHelpers.getStudentByIdNumber(idNumber);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    res.json({ 
      success: true, 
      student 
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching student' 
    });
  }
});

// Update student (admin)
app.put('/api/admin/students/:idNumber', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber } = req.params;
    const { firstname, lastname, middlename, course, courseLevel, email, sessions } = req.body;

    const result = await dbHelpers.updateStudent(idNumber, { firstname, lastname, middlename, course, courseLevel, email, sessions });

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating student' 
    });
  }
});

// Delete student (admin)
app.delete('/api/admin/students/:idNumber', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber } = req.params;
    const result = await dbHelpers.deleteStudent(idNumber);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting student' 
    });
  }
});

// Reset all student sessions (admin)
app.post('/api/admin/students/reset-sessions', authenticateAdmin, async (req, res) => {
  try {
    const result = await dbHelpers.resetAllSessions();
    res.json({ 
      success: true, 
      message: 'All student sessions have been reset',
      affected: result.changes
    });
  } catch (error) {
    console.error('Error resetting sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error resetting sessions' 
    });
  }
});

// Create Sit-In record
app.post('/api/admin/sitin', authenticateAdmin, async (req, res) => {
  try {
    const { idNumber, purpose, lab, pcNumber } = req.body;

    if (!idNumber || !purpose || !lab) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID Number, Purpose, and Lab are required' 
      });
    }

    if (pcNumber) {
      const isDisabled = await dbHelpers.isPCDisabled(lab, pcNumber);
      if (isDisabled) {
        return res.status(400).json({
          success: false,
          message: `PC ${pcNumber} in Lab ${lab} is currently disabled/out of order`
        });
      }
    }

    // Get student
    const student = await dbHelpers.getUserByIdNumber(idNumber);
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Check if student has remaining sessions
    const sessions = student.sessions || 30;
    if (sessions <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No remaining sessions' 
      });
    }

    // Create sit-in record
    const result = await dbHelpers.createSitInRecord(student.id, purpose, lab, pcNumber);

    // Decrease session count
    await dbHelpers.updateStudentSessions(idNumber, sessions - 1);

    res.json({ 
      success: true, 
      message: 'Sit-In recorded successfully',
      remainingSessions: sessions - 1
    });
  } catch (error) {
    console.error('Error creating sit-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating sit-in' 
    });
  }
});

// Get all sit-in records
app.get('/api/admin/sitin-records', authenticateAdmin, async (req, res) => {
  try {
    const records = await dbHelpers.getAllSitInRecords();
    res.json({ 
      success: true, 
      records 
    });
  } catch (error) {
    console.error('Error fetching sit-in records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching sit-in records' 
    });
  }
});

// Complete sit-in record
app.put('/api/admin/sitin-records/:id/complete', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbHelpers.completeSitInRecord(id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sit-in record not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Sit-in completed successfully'
    });
  } catch (error) {
    console.error('Error completing sit-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error completing sit-in' 
    });
  }
});

// Get student's sit-in history
app.get('/api/student/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const history = await dbHelpers.getStudentHistory(userId);
    
    // Check feedback status for each record
    const historyWithFeedback = await Promise.all(
      history.map(async (record) => {
        const hasFeedback = await dbHelpers.hasFeedback(record.id);
        return {
          ...record,
          hasFeedback
        };
      })
    );
    
    res.json({ 
      success: true, 
      history: historyWithFeedback
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching history' 
    });
  }
});

// Create reservation
app.post('/api/student/reservations', authenticateToken, async (req, res) => {
  try {
    const isEnabled = await dbHelpers.getSetting('reservations_enabled');
    if (isEnabled === 'false') {
      return res.status(403).json({
        success: false,
        message: 'Reservations are currently disabled by the administrator'
      });
    }

    const { lab, purpose, date, time, pcNumber } = req.body;
    const userId = req.user.userId;

    if (!lab || !purpose || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (pcNumber) {
      const isDisabled = await dbHelpers.isPCDisabled(lab, pcNumber);
      if (isDisabled) {
        return res.status(400).json({
          success: false,
          message: `PC ${pcNumber} in Lab ${lab} is currently disabled/out of order`
        });
      }
    }

    const result = await dbHelpers.createReservation(userId, lab, purpose, date, time, pcNumber);

    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully',
      reservationId: result.id
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating reservation' 
    });
  }
});

// Get student's reservations
app.get('/api/student/reservations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const reservations = await dbHelpers.getStudentReservations(userId);
    
    res.json({ 
      success: true, 
      reservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching reservations' 
    });
  }
});

// Cancel reservation
app.put('/api/student/reservations/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const result = await dbHelpers.cancelReservation(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found or cannot be cancelled' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error cancelling reservation' 
    });
  }
});

// Submit feedback
   app.post('/api/student/feedback', authenticateToken, async (req, res) => {
     try {
       const { sitinId, rating, comment } = req.body;
       const userId = req.user.userId;

       if (!sitinId || !rating) {
         return res.status(400).json({ 
           success: false, 
           message: 'Sit-in ID and rating are required' 
         });
       }

       // Check if feedback already exists
       const hasFeedback = await dbHelpers.hasFeedback(sitinId);
       if (hasFeedback) {
         return res.status(400).json({ 
           success: false, 
           message: 'Feedback already submitted for this sit-in' 
         });
       }

       const result = await dbHelpers.createFeedback(userId, sitinId, rating, comment);

       res.status(201).json({ 
         success: true, 
         message: 'Feedback submitted successfully',
         feedbackId: result.id
       });
     } catch (error) {
       console.error('Error submitting feedback:', error);
       res.status(500).json({ 
         success: false, 
         message: 'Server error submitting feedback' 
       });
     }
   });

   // Get student's sessions
   app.get('/api/student/sessions', authenticateToken, async (req, res) => {
     try {
       const userId = req.user.userId;
       const sessions = await dbHelpers.getStudentSessions(userId);
       
       res.json({ 
         success: true, 
         sessions
       });
     } catch (error) {
       console.error('Error fetching sessions:', error);
       res.status(500).json({ 
         success: false, 
         message: 'Server error fetching sessions' 
       });
     }
   });

   // Get leaderboard
   app.get('/api/leaderboard', async (req, res) => {
     try {
       const leaderboard = await dbHelpers.getLeaderboard();
       
       res.json({ 
         success: true, 
         leaderboard
       });
     } catch (error) {
       console.error('Error fetching leaderboard:', error);
       res.status(500).json({ 
         success: false, 
         message: 'Server error fetching leaderboard' 
       });
     }
   });

   // Get all feedback reports (admin)
app.get('/api/admin/feedback-reports', authenticateAdmin, async (req, res) => {
  try {
    const feedback = await dbHelpers.getAllFeedback();
    res.json({ 
      success: true, 
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback reports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching feedback reports' 
    });
  }
});

// Get all reservations (admin)
app.get('/api/admin/reservations', authenticateAdmin, async (req, res) => {
  try {
    const reservations = await dbHelpers.getAllReservations();
    res.json({ 
      success: true, 
      reservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching reservations' 
    });
  }
});

// Update reservation status (admin)
app.put('/api/admin/reservations/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be approved or cancelled' 
      });
    }

    const result = await dbHelpers.updateReservationStatus(id, status);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reservation not found' 
      });
    }

    res.json({ 
      success: true, 
      message: `Reservation ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating reservation status' 
    });
  }
});

// Start server - only listen if running locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`🚀 App is ready! Click here to open: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}


// Lab Software APIs
app.get('/api/lab-software', async (req, res) => {
  try {
    const { lab } = req.query;
    const software = await dbHelpers.getLabSoftware(lab);
    res.json({ success: true, software });
  } catch (error) {
    console.error('Error fetching lab software:', error);
    res.status(500).json({ success: false, message: 'Server error fetching lab software' });
  }
});

app.post('/api/admin/lab-software', authenticateAdmin, async (req, res) => {
  try {
    const { lab, softwareName } = req.body;
    if (!lab || !softwareName) return res.status(400).json({ success: false, message: 'Lab and Software Name required' });
    const result = await dbHelpers.addLabSoftware(lab, softwareName);
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error adding lab software:', error);
    res.status(500).json({ success: false, message: 'Server error adding lab software' });
  }
});

app.delete('/api/admin/lab-software/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbHelpers.deleteLabSoftware(id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lab software:', error);
    res.status(500).json({ success: false, message: 'Server error deleting lab software' });
  }
});

// Settings APIs
app.get('/api/settings/:key', async (req, res) => {
  try {
    const value = await dbHelpers.getSetting(req.params.key);
    res.json({ success: true, value });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error getting setting' });
  }
});

app.put('/api/admin/settings/:key', authenticateAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    await dbHelpers.updateSetting(req.params.key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating setting' });
  }
});

// Disabled PC APIs
app.get('/api/disabled-pcs', async (req, res) => {
  try {
    const disabledPCs = await dbHelpers.getDisabledPCs();
    res.json({ success: true, disabledPCs });
  } catch (error) {
    console.error('Error fetching disabled PCs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching disabled PCs' });
  }
});

app.post('/api/admin/disabled-pcs/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { lab, pcNumber } = req.body;
    if (!lab || !pcNumber) {
      return res.status(400).json({ success: false, message: 'Lab and PC Number are required' });
    }
    const result = await dbHelpers.toggleDisabledPC(lab, pcNumber);
    res.json({ 
      success: true, 
      disabled: result.disabled, 
      message: `PC ${pcNumber} in Lab ${lab} ${result.disabled ? 'disabled' : 'enabled'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling disabled PC:', error);
    res.status(500).json({ success: false, message: 'Server error toggling PC status' });
  }
});

// Export the app for Vercel serverless functions
module.exports = app;
