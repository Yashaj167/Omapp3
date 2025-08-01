// Real MySQL Database API service
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  affectedRows?: number;
}

class DatabaseApiService {
  private config: DatabaseConfig | null = null;
  private isConnected = false;

  async initialize(config: DatabaseConfig): Promise<boolean> {
    this.config = config;
    try {
      // Test the connection first
      const testResult = await this.testConnection();
      if (testResult) {
        this.isConnected = true;
        // Create tables if they don't exist
        await this.createTables();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Database initialization error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Database not configured');
    }

    try {
      // Use a serverless function or API endpoint to test MySQL connection
      const response = await fetch('/api/test-db-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config),
      });

      if (response.ok) {
        const result = await response.json();
        return result.success;
      }
      return false;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    if (!this.isConnected || !this.config) {
      return {
        success: false,
        error: 'Database not connected'
      };
    }

    try {
      const response = await fetch('/api/db-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: this.config,
          sql,
          params
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `Query failed: ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  // Database schema creation
  async createTables(): Promise<boolean> {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('main_admin', 'staff_admin', 'challan_staff', 'field_collection_staff', 'data_entry_staff', 'document_delivery_staff') NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Documents table
      `CREATE TABLE IF NOT EXISTS documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_number VARCHAR(100) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        builder_name VARCHAR(255) NOT NULL,
        property_details TEXT NOT NULL,
        document_type ENUM('agreement', 'lease_deed', 'sale_deed', 'mutation', 'partition_deed', 'gift_deed') NOT NULL,
        status ENUM('pending_collection', 'collected', 'data_entry_pending', 'data_entry_completed', 'registration_pending', 'registered', 'ready_for_delivery', 'delivered') DEFAULT 'pending_collection',
        assigned_to VARCHAR(255),
        collection_date TIMESTAMP NULL,
        data_entry_date TIMESTAMP NULL,
        registration_date TIMESTAMP NULL,
        delivery_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_document_number (document_number),
        INDEX idx_customer_phone (customer_phone),
        INDEX idx_status (status),
        INDEX idx_document_type (document_type),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_phone (phone),
        INDEX idx_email (email),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Builders table
      `CREATE TABLE IF NOT EXISTS builders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT NOT NULL,
        registration_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_phone (phone),
        INDEX idx_registration_number (registration_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_id INT NOT NULL,
        agreement_value DECIMAL(15,2) NOT NULL,
        consideration_amount DECIMAL(15,2) NOT NULL,
        dhc_amount DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        pending_amount DECIMAL(15,2) NOT NULL,
        payment_status ENUM('pending', 'partial', 'completed', 'refunded') DEFAULT 'pending',
        payment_method ENUM('cash', 'cheque', 'online', 'dd'),
        payment_date DATE,
        challan_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_document_id (document_id),
        INDEX idx_payment_status (payment_status),
        INDEX idx_challan_number (challan_number),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Challans table
      `CREATE TABLE IF NOT EXISTS challans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_id INT NOT NULL,
        challan_number VARCHAR(100) UNIQUE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        filled_by VARCHAR(255) NOT NULL,
        filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_challan_number (challan_number),
        INDEX idx_document_id (document_id),
        INDEX idx_status (status),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type ENUM('document_collection', 'data_entry', 'document_delivery', 'challan_creation', 'payment_processing', 'customer_follow_up', 'document_verification', 'registration_follow_up', 'quality_check', 'custom') NOT NULL,
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'on_hold', 'completed', 'cancelled', 'overdue') DEFAULT 'pending',
        assigned_to VARCHAR(255) NOT NULL,
        assigned_by VARCHAR(255) NOT NULL,
        document_id INT,
        customer_id INT,
        builder_id INT,
        due_date TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        estimated_hours DECIMAL(4,2),
        actual_hours DECIMAL(4,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_status (status),
        INDEX idx_type (type),
        INDEX idx_priority (priority),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Attendance records table
      `CREATE TABLE IF NOT EXISTS attendance_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        clock_in_time TIMESTAMP NULL,
        clock_out_time TIMESTAMP NULL,
        status ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'work_from_home') DEFAULT 'present',
        total_hours DECIMAL(4,2),
        break_time INT DEFAULT 60,
        overtime DECIMAL(4,2) DEFAULT 0,
        location VARCHAR(255),
        notes TEXT,
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (user_id, date),
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Document files table
      `CREATE TABLE IF NOT EXISTS document_files (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type ENUM('scan', 'photo', 'document') NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        uploaded_by VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_document_id (document_id),
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Task comments table
      `CREATE TABLE IF NOT EXISTS task_comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        content TEXT NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        author_name VARCHAR(255) NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_task_id (task_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // User permissions table
      `CREATE TABLE IF NOT EXISTS user_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        granted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_permission (user_id, module, action),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Salary records table
      `CREATE TABLE IF NOT EXISTS salary_records (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        allowances JSON,
        deductions JSON,
        overtime JSON,
        bonus DECIMAL(10,2) DEFAULT 0,
        gross_salary DECIMAL(10,2) NOT NULL,
        net_salary DECIMAL(10,2) NOT NULL,
        pay_period_month INT NOT NULL,
        pay_period_year INT NOT NULL,
        pay_date DATE NOT NULL,
        status ENUM('draft', 'pending_approval', 'approved', 'paid', 'cancelled') DEFAULT 'draft',
        payment_method ENUM('bank_transfer', 'cash', 'cheque', 'upi') DEFAULT 'bank_transfer',
        bank_details JSON,
        notes TEXT,
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_pay_period (pay_period_month, pay_period_year),
        INDEX idx_status (status),
        INDEX idx_pay_date (pay_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Staff salary configurations table
      `CREATE TABLE IF NOT EXISTS staff_salary_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        allowances JSON,
        deductions JSON,
        overtime_rate DECIMAL(6,2) DEFAULT 0,
        payment_method ENUM('bank_transfer', 'cash', 'cheque', 'upi') DEFAULT 'bank_transfer',
        bank_details JSON,
        is_active BOOLEAN DEFAULT TRUE,
        effective_from DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_active (is_active),
        INDEX idx_effective_from (effective_from),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // App settings table
      `CREATE TABLE IF NOT EXISTS app_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Task permissions table
      `CREATE TABLE IF NOT EXISTS task_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        task_type ENUM('document_collection', 'data_entry', 'document_delivery', 'challan_creation', 'payment_processing', 'customer_follow_up', 'document_verification', 'registration_follow_up', 'quality_check', 'custom') NOT NULL,
        permissions JSON NOT NULL,
        restrictions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_task_type (user_id, task_type),
        INDEX idx_user_id (user_id),
        INDEX idx_task_type (task_type),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      // Leave requests table
      `CREATE TABLE IF NOT EXISTS leave_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        leave_type ENUM('sick_leave', 'casual_leave', 'annual_leave', 'maternity_leave', 'paternity_leave', 'emergency_leave') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days INT NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP NULL,
        review_comments TEXT,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_start_date (start_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    try {
      for (const tableSQL of tables) {
        const result = await this.query(tableSQL);
        if (!result.success) {
          console.error('Error creating table:', result.error);
          return false;
        }
      }
      
      // Insert default admin user if users table is empty
      await this.createDefaultAdmin();
      
      return true;
    } catch (error) {
      console.error('Error creating tables:', error);
      return false;
    }
  }

  async createDefaultAdmin(): Promise<void> {
    try {
      // Check if any users exist
      const checkResult = await this.query('SELECT COUNT(*) as count FROM users');
      if (checkResult.success && checkResult.data && checkResult.data[0].count === 0) {
        // Create default admin user
        const defaultAdmin = {
          email: 'admin@omservices.com',
          name: 'Main Admin',
          role: 'main_admin',
          password_hash: '$2b$10$rGKqDvQKNGnwxirsQg8OUeEcDNbpTLdU7ErMkqm6wjvLOKqm6wjvL', // password123
          is_active: true
        };

        await this.query(
          'INSERT INTO users (email, name, role, password_hash, is_active) VALUES (?, ?, ?, ?, ?)',
          [defaultAdmin.email, defaultAdmin.name, defaultAdmin.role, defaultAdmin.password_hash, defaultAdmin.is_active]
        );
        
        console.log('Default admin user created');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }

  // User management queries
  async createUser(userData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO users (email, name, role, password_hash, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    return this.query(sql, [
      userData.email,
      userData.name,
      userData.role,
      userData.passwordHash,
      userData.isActive
    ]);
  }

  async getUserByEmail(email: string): Promise<QueryResult> {
    const sql = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    return this.query(sql, [email]);
  }

  async updateUser(userId: string, userData: any): Promise<QueryResult> {
    const sql = `
      UPDATE users 
      SET name = ?, role = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `;
    return this.query(sql, [
      userData.name,
      userData.role,
      userData.isActive,
      userId
    ]);
  }

  // Document management queries
  async createDocument(documentData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO documents (
        document_number, customer_name, customer_phone, customer_email,
        builder_name, property_details, document_type, status,
        assigned_to, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [
      documentData.documentNumber,
      documentData.customerName,
      documentData.customerPhone,
      documentData.customerEmail,
      documentData.builderName,
      documentData.propertyDetails,
      documentData.documentType,
      documentData.status,
      documentData.assignedTo
    ]);
  }

  async getDocuments(filters: any = {}): Promise<QueryResult> {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.assignedTo) {
      sql += ' AND assigned_to = ?';
      params.push(filters.assignedTo);
    }

    sql += ' ORDER BY created_at DESC';

    return this.query(sql, params);
  }

  async updateDocumentStatus(documentId: string, status: string): Promise<QueryResult> {
    const sql = 'UPDATE documents SET status = ?, updated_at = NOW() WHERE id = ?';
    return this.query(sql, [status, documentId]);
  }

  // Payment management queries
  async createPayment(paymentData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO payments (
        document_id, agreement_value, consideration_amount, dhc_amount,
        total_amount, paid_amount, pending_amount, payment_status,
        payment_method, payment_date, challan_number, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [
      paymentData.documentId,
      paymentData.agreementValue,
      paymentData.considerationAmount,
      paymentData.dhcAmount,
      paymentData.totalAmount,
      paymentData.paidAmount,
      paymentData.pendingAmount,
      paymentData.paymentStatus,
      paymentData.paymentMethod,
      paymentData.paymentDate,
      paymentData.challanNumber
    ]);
  }

  // Challan management queries
  async createChallan(challanData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO challans (
        document_id, challan_number, amount, filled_by, filled_at,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [
      challanData.documentId,
      challanData.challanNumber,
      challanData.amount,
      challanData.filledBy,
      challanData.status,
      challanData.notes
    ]);
  }

  // Task management queries
  async createTask(taskData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO tasks (
        title, description, type, priority, status, assigned_to, assigned_by,
        document_id, customer_id, builder_id, due_date, estimated_hours,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [
      taskData.title,
      taskData.description,
      taskData.type,
      taskData.priority,
      taskData.status,
      taskData.assignedTo,
      taskData.assignedBy,
      taskData.documentId,
      taskData.customerId,
      taskData.builderId,
      taskData.dueDate,
      taskData.estimatedHours
    ]);
  }

  // Attendance management queries
  async clockIn(userId: string, location?: string, notes?: string): Promise<QueryResult> {
    const sql = `
      INSERT INTO attendance_records (
        user_id, date, clock_in_time, status, location, notes, created_at, updated_at
      ) VALUES (?, CURDATE(), NOW(), 'present', ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [userId, location, notes]);
  }

  async clockOut(userId: string, notes?: string): Promise<QueryResult> {
    const sql = `
      UPDATE attendance_records 
      SET clock_out_time = NOW(), 
          total_hours = TIMESTAMPDIFF(MINUTE, clock_in_time, NOW()) / 60,
          notes = COALESCE(?, notes),
          updated_at = NOW()
      WHERE user_id = ? AND date = CURDATE() AND clock_out_time IS NULL
    `;
    return this.query(sql, [notes, userId]);
  }

  disconnect(): void {
    this.isConnected = false;
    this.config = null;
  }
}

export const databaseApi = new DatabaseApiService();