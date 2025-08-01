// Gmail API service for real Gmail integration
export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments?: GmailAttachment[];
}

export interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

class GmailApiService {
  private gapi: any;
  private isInitialized = false;
  private authInstance: any;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if credentials are configured (from settings or environment)
    let apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // Try to get from saved settings if not in environment
    if (!apiKey || !clientId) {
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.gmail?.enabled && config.gmail?.config) {
          clientId = config.gmail.config.clientId;
          apiKey = config.gmail.config.apiKey;
        }
      }
    }

    if (!apiKey || !clientId) {
      throw new Error('Gmail API credentials not configured. Please configure them in Settings → Gmail API section.');
    }

    return new Promise((resolve, reject) => {
      // Load Google API script
      if (!(window as any).gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => this.initializeGapi(resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
      } else {
        this.initializeGapi(resolve, reject);
      }
    });
  }

  private async initializeGapi(resolve: () => void, reject: (error: Error) => void): Promise<void> {
    try {
      this.gapi = (window as any).gapi;
      
      await new Promise<void>((resolveLoad) => {
        this.gapi.load('client:auth2', resolveLoad);
      });

      await this.gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify'
      });

      this.authInstance = this.gapi.auth2.getAuthInstance();
      this.isInitialized = true;
      resolve();
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to initialize Gmail API'));
    }
  }

  async signIn(): Promise<boolean> {
    try {
      await this.initialize();
      
      if (this.authInstance.isSignedIn.get()) {
        return true;
      }

      const user = await this.authInstance.signIn({
        prompt: 'select_account'
      });
      
      return user.isSignedIn();
    } catch (error) {
      console.error('Gmail sign-in error:', error);
      throw new Error('Failed to sign in to Gmail. Please check your credentials and try again.');
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.authInstance) {
        await this.authInstance.signOut();
      }
    } catch (error) {
      console.error('Gmail sign-out error:', error);
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      // Check if credentials are available before initializing
      let apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      // Try to get from saved settings if not in environment
      if (!apiKey || !clientId) {
        const savedConfig = localStorage.getItem('apiConfig');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.gmail?.enabled && config.gmail?.config) {
            clientId = config.gmail.config.clientId;
            apiKey = config.gmail.config.apiKey;
          }
        }
      }

      // Return false if credentials are not configured instead of throwing error
      if (!apiKey || !clientId) {
        return false;
      }

      await this.initialize();
      return this.authInstance?.isSignedIn.get() || false;
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      if (!this.authInstance) {
        await this.initialize();
      }
      return this.authInstance?.currentUser.get();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getMessages(maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      });

      const messages = response.result.messages || [];
      const detailedMessages: GmailMessage[] = [];

      // Fetch details for each message (in batches to avoid rate limits)
      const batchSize = 10;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchPromises = batch.map(async (message: any) => {
          try {
            const detail = await this.gapi.client.gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'full'
            });
            return this.parseMessage(detail.result);
          } catch (error) {
            console.error(`Error fetching message ${message.id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        detailedMessages.push(...batchResults.filter(msg => msg !== null));
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return detailedMessages.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch Gmail messages. Please check your permissions and try again.');
    }
  }

  private parseMessage(message: any): GmailMessage | null {
    try {
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject') || '(No Subject)';
      const from = getHeader('From');
      const to = getHeader('To');
      const date = new Date(parseInt(message.internalDate));

      // Extract body
      let body = '';
      if (message.payload?.body?.data) {
        body = this.decodeBase64(message.payload.body.data);
      } else if (message.payload?.parts) {
        const textPart = message.payload.parts.find((part: any) => 
          part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = this.decodeBase64(textPart.body.data);
        }
      }

      // Clean HTML if present
      if (body.includes('<')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = body;
        body = tempDiv.textContent || tempDiv.innerText || '';
      }

      // Limit body length for display
      body = body.substring(0, 500);

      const isRead = !message.labelIds?.includes('UNREAD');
      const isStarred = message.labelIds?.includes('STARRED') || false;

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from: this.extractEmail(from),
        to: this.extractEmail(to),
        date,
        body,
        isRead,
        isStarred,
        labels: message.labelIds || [],
        attachments: this.extractAttachments(message.payload)
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  private decodeBase64(data: string): string {
    try {
      // Gmail API returns base64url encoded data
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;
      return decodeURIComponent(escape(atob(paddedBase64)));
    } catch (error) {
      console.error('Error decoding base64:', error);
      return data;
    }
  }

  private extractEmail(emailString: string): string {
    if (!emailString) return '';
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString.split(' ')[emailString.split(' ').length - 1];
  }

  private extractAttachments(payload: any): GmailAttachment[] {
    const attachments: GmailAttachment[] = [];
    
    const extractFromParts = (parts: any[]) => {
      parts.forEach(part => {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0
          });
        }
        if (part.parts) {
          extractFromParts(part.parts);
        }
      });
    };

    if (payload?.parts) {
      extractFromParts(payload.parts);
    }

    return attachments;
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        removeLabelIds: ['UNREAD']
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  async markAsUnread(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        addLabelIds: ['UNREAD']
      });
    } catch (error) {
      console.error('Error marking as unread:', error);
      throw new Error('Failed to mark message as unread');
    }
  }

  async starMessage(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        addLabelIds: ['STARRED']
      });
    } catch (error) {
      console.error('Error starring message:', error);
      throw new Error('Failed to star message');
    }
  }

  async unstarMessage(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        removeLabelIds: ['STARRED']
      });
    } catch (error) {
      console.error('Error unstarring message:', error);
      throw new Error('Failed to unstar message');
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gapi.client.gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  async sendReply(originalMessageId: string, content: string): Promise<void> {
    try {
      // Get original message for reply headers
      const originalMessage = await this.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: originalMessageId,
        format: 'full'
      });

      const headers = originalMessage.result.payload.headers;
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const to = getHeader('From');
      const subject = getHeader('Subject');
      const messageId = getHeader('Message-ID');

      const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;

      const email = [
        `To: ${to}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        '',
        content
      ].join('\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedEmail
        }
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      throw new Error('Failed to send reply');
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox is:unread',
        maxResults: 1
      });
      return response.result.resultSizeEstimate || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const gmailApi = new GmailApiService();