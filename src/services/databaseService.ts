// Database service for real MySQL integration
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

class DatabaseService {
  private config: DatabaseConfig | null = null;
  private isConnected = false;

  async initialize(): Promise<boolean> {
    try {
      // Load configuration from localStorage
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.mysql?.enabled && config.mysql?.config) {
          this.config = config.mysql.config;
          // Test connection
          const testResult = await this.testConnection();
          this.isConnected = testResult;
          return testResult;
        }
      }
      return false;
    } catch (error) {
      console.error('Database initialization error:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      const response = await fetch('/api/test-db-connection.php', {
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
      const response = await fetch('/api/db-query.php', {
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

  // User operations
  async getUsers(): Promise<QueryResult> {
    const sql = `
      SELECT id, email, name, role, is_active as isActive, 
             created_at as createdAt, last_login as lastLogin
      FROM users 
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

  async createUser(userData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO users (email, name, role, password_hash, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    return this.query(sql, [
      userData.email,
      userData.name,
      userData.role,
      userData.passwordHash || '$2b$10$defaulthash', // In real app, hash the password
      userData.isActive ? 1 : 0
    ]);
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
      userData.isActive ? 1 : 0,
      userId
    ]);
  }

  // Customer operations
  async getCustomers(): Promise<QueryResult> {
    const sql = `
      SELECT c.*, 
             GROUP_CONCAT(d.document_number) as documents
      FROM customers c
      LEFT JOIN documents d ON d.customer_phone = c.phone
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return this.query(sql);
  }

  async createCustomer(customerData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO customers (name, phone, email, address, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    return this.query(sql, [
      customerData.name,
      customerData.phone,
      customerData.email,
      customerData.address
    ]);
  }

  async updateCustomer(customerId: string, customerData: any): Promise<QueryResult> {
    const sql = `
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, address = ?
      WHERE id = ?
    `;
    return this.query(sql, [
      customerData.name,
      customerData.phone,
      customerData.email,
      customerData.address,
      customerId
    ]);
  }

  // Builder operations
  async getBuilders(): Promise<QueryResult> {
    const sql = `
      SELECT b.*, 
             GROUP_CONCAT(d.document_number) as documents
      FROM builders b
      LEFT JOIN documents d ON d.builder_name = b.name
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `;
    return this.query(sql);
  }

  async createBuilder(builderData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO builders (name, contact_person, phone, email, address, registration_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    return this.query(sql, [
      builderData.name,
      builderData.contactPerson,
      builderData.phone,
      builderData.email,
      builderData.address,
      builderData.registrationNumber
    ]);
  }

  async updateBuilder(builderId: string, builderData: any): Promise<QueryResult> {
    const sql = `
      UPDATE builders 
      SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, registration_number = ?
      WHERE id = ?
    `;
    return this.query(sql, [
      builderData.name,
      builderData.contactPerson,
      builderData.phone,
      builderData.email,
      builderData.address,
      builderData.registrationNumber,
      builderId
    ]);
  }

  // Document operations
  async getDocuments(): Promise<QueryResult> {
    const sql = `
      SELECT * FROM documents 
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

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
      documentData.status || 'pending_collection',
      documentData.assignedTo
    ]);
  }

  async updateDocument(documentId: string, documentData: any): Promise<QueryResult> {
    const fields = [];
    const values = [];

    Object.keys(documentData).forEach(key => {
      if (documentData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(documentData[key]);
      }
    });

    if (fields.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    fields.push('updated_at = NOW()');
    values.push(documentId);

    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
    return this.query(sql, values);
  }

  // Payment operations
  async getPayments(): Promise<QueryResult> {
    const sql = `
      SELECT * FROM payments 
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

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

  // Challan operations
  async getChallans(): Promise<QueryResult> {
    const sql = `
      SELECT * FROM challans 
      ORDER BY created_at DESC
    `;
    return this.query(sql);
  }

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
      challanData.status || 'draft',
      challanData.notes
    ]);
  }

  isConnected(): boolean {
    return this.isConnected;
  }

  // Salary management queries
  async createSalaryRecord(salaryData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO salary_records (
        user_id, user_name, user_role, base_salary, allowances, deductions,
        overtime, bonus, gross_salary, net_salary, pay_period_month, pay_period_year,
        pay_date, status, payment_method, bank_details, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [
      salaryData.userId,
      salaryData.userName,
      salaryData.userRole,
      salaryData.baseSalary,
      JSON.stringify(salaryData.allowances),
      JSON.stringify(salaryData.deductions),
      JSON.stringify(salaryData.overtime),
      salaryData.bonus,
      salaryData.grossSalary,
      salaryData.netSalary,
      salaryData.payPeriod.month,
      salaryData.payPeriod.year,
      salaryData.payDate,
      salaryData.status,
      salaryData.paymentMethod,
      JSON.stringify(salaryData.bankDetails),
      salaryData.notes
    ]);
  }

  async getSalaryRecords(filters: any = {}): Promise<QueryResult> {
    let sql = 'SELECT * FROM salary_records WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      sql += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.month && filters.year) {
      sql += ' AND pay_period_month = ? AND pay_period_year = ?';
      params.push(filters.month, filters.year);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';
    return this.query(sql, params);
  }

  async updateSalaryRecord(recordId: string, salaryData: any): Promise<QueryResult> {
    const fields = [];
    const values = [];

    Object.keys(salaryData).forEach(key => {
      if (salaryData[key] !== undefined) {
        if (key === 'allowances' || key === 'deductions' || key === 'overtime' || key === 'bankDetails') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(salaryData[key]));
        } else if (key === 'payPeriod') {
          fields.push('pay_period_month = ?', 'pay_period_year = ?');
          values.push(salaryData[key].month, salaryData[key].year);
        } else {
          fields.push(`${key} = ?`);
          values.push(salaryData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    fields.push('updated_at = NOW()');
    values.push(recordId);

    const sql = `UPDATE salary_records SET ${fields.join(', ')} WHERE id = ?`;
    return this.query(sql, values);
  }

  async createStaffConfig(configData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO staff_salary_configs (
        user_id, base_salary, allowances, deductions, overtime_rate,
        payment_method, bank_details, is_active, effective_from, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    return this.query(sql, [
      configData.userId,
      configData.baseSalary,
      JSON.stringify(configData.allowances),
      JSON.stringify(configData.deductions),
      configData.overtimeRate,
      configData.paymentMethod,
      JSON.stringify(configData.bankDetails),
      configData.isActive ? 1 : 0,
      configData.effectiveFrom
    ]);
  }

  async getStaffConfigs(): Promise<QueryResult> {
    const sql = 'SELECT * FROM staff_salary_configs WHERE is_active = 1 ORDER BY created_at DESC';
    return this.query(sql);
  }

  async updateStaffConfig(configId: string, configData: any): Promise<QueryResult> {
    const fields = [];
    const values = [];

    Object.keys(configData).forEach(key => {
      if (configData[key] !== undefined) {
        if (key === 'allowances' || key === 'deductions' || key === 'bankDetails') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(configData[key]));
        } else if (key === 'isActive') {
          fields.push(`is_active = ?`);
          values.push(configData[key] ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(configData[key]);
        }
      }
    });

    if (fields.length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    fields.push('updated_at = NOW()');
    values.push(configId);

    const sql = `UPDATE staff_salary_configs SET ${fields.join(', ')} WHERE id = ?`;
    return this.query(sql, values);
  }

  // Settings management queries
  async saveSettings(settingsData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
    `;
    return this.query(sql, [settingsData.key, JSON.stringify(settingsData.value)]);
  }

  async getSettings(): Promise<QueryResult> {
    const sql = 'SELECT * FROM app_settings ORDER BY setting_key';
    return this.query(sql);
  }

  // Task management queries
  async createTask(taskData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO tasks (
        title, description, type, priority, status, assigned_to, assigned_by,
        document_id, customer_id, builder_id, due_date, estimated_hours,
        tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
      taskData.estimatedHours,
      JSON.stringify(taskData.tags)
    ]);
  }

  async getTasks(filters: any = {}): Promise<QueryResult> {
    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filters.assignedTo) {
      sql += ' AND assigned_to = ?';
      params.push(filters.assignedTo);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    sql += ' ORDER BY created_at DESC';
    return this.query(sql, params);
  }

  async updateTaskStatus(taskId: string, status: string): Promise<QueryResult> {
    const sql = `
      UPDATE tasks 
      SET status = ?, updated_at = NOW()
      ${status === 'completed' ? ', completed_at = NOW()' : ''}
      WHERE id = ?
    `;
    return this.query(sql, [status, taskId]);
  }

  async addTaskComment(commentData: any): Promise<QueryResult> {
    const sql = `
      INSERT INTO task_comments (
        task_id, content, author_id, author_name, is_internal, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;
    return this.query(sql, [
      commentData.taskId,
      commentData.content,
      commentData.authorId,
      commentData.authorName,
      commentData.isInternal ? 1 : 0
    ]);
  }

  getConfig(): DatabaseConfig | null {
    return this.config;
  }
}

export const databaseService = new DatabaseService();