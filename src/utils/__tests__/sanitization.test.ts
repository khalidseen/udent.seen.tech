/**
 * اختبارات دوال التنظيف والتعقيم
 * Sanitization Utilities Tests
 * 
 * اختبار جميع دوال تنظيف المدخلات وكشف الهجمات
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNationalId,
  sanitizeURL,
  sanitizeFilename,
  sanitizeObject,
  detectXSS,
  detectSQLInjection,
  detectPathTraversal,
  securityCheck,
} from '@/utils/sanitization';

describe('Sanitization Utils', () => {
  // ====================================================================
  // sanitizeString Tests
  // ====================================================================
  
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(input);
      expect(result).toBe('Hello');
      expect(result).not.toContain('<script>');
    });

    it('should remove dangerous characters', () => {
      const input = 'Hello<>\'\"World';
      const result = sanitizeString(input);
      expect(result).toBe('HelloWorld');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeString(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert(1)';
      const result = sanitizeString(input);
      expect(result).not.toContain('onclick');
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World');
    });
  });

  // ====================================================================
  // sanitizeEmail Tests
  // ====================================================================
  
  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const input = 'JOHN@EXAMPLE.COM';
      const result = sanitizeEmail(input);
      expect(result).toBe('john@example.com');
    });

    it('should remove invalid characters', () => {
      const input = 'john<>@example.com';
      const result = sanitizeEmail(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  john@example.com  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('john@example.com');
    });

    it('should handle empty input', () => {
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeEmail(null as any)).toBe('');
    });

    it('should keep valid email characters', () => {
      const input = 'john.doe+test@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('john.doe+test@example.com');
    });
  });

  // ====================================================================
  // sanitizePhone Tests
  // ====================================================================
  
  describe('sanitizePhone', () => {
    it('should remove invalid characters', () => {
      const input = '(050) 123-4567';
      const result = sanitizePhone(input);
      expect(result).toMatch(/^[\d\s\-\+\(\)]+$/);
    });

    it('should keep valid phone characters', () => {
      const input = '+966501234567';
      const result = sanitizePhone(input);
      expect(result).toBe('+966501234567');
    });

    it('should handle empty input', () => {
      expect(sanitizePhone('')).toBe('');
      expect(sanitizePhone(null as any)).toBe('');
    });

    it('should remove letters', () => {
      const input = '0501234567ABC';
      const result = sanitizePhone(input);
      expect(result).not.toContain('ABC');
    });
  });

  // ====================================================================
  // sanitizeNationalId Tests
  // ====================================================================
  
  describe('sanitizeNationalId', () => {
    it('should keep only digits', () => {
      const input = '1-012-345-678';
      const result = sanitizeNationalId(input);
      expect(result).toBe('1012345678');
    });

    it('should remove all non-digit characters', () => {
      const input = 'ID:1012345678';
      const result = sanitizeNationalId(input);
      expect(result).toBe('1012345678');
    });

    it('should handle empty input', () => {
      expect(sanitizeNationalId('')).toBe('');
      expect(sanitizeNationalId(null as any)).toBe('');
    });
  });

  // ====================================================================
  // sanitizeURL Tests
  // ====================================================================
  
  describe('sanitizeURL', () => {
    it('should accept valid HTTP URLs', () => {
      const input = 'http://example.com';
      const result = sanitizeURL(input);
      expect(result).toBe('http://example.com/');
    });

    it('should accept valid HTTPS URLs', () => {
      const input = 'https://example.com';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com/');
    });

    it('should reject javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should reject file: protocol', () => {
      const input = 'file:///etc/passwd';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      const input = 'not a url';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });
  });

  // ====================================================================
  // sanitizeFilename Tests
  // ====================================================================
  
  describe('sanitizeFilename', () => {
    it('should remove invalid characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain(':');
    });

    it('should prevent path traversal', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('..');
    });

    it('should prevent leading dots', () => {
      const input = '.hidden-file.txt';
      const result = sanitizeFilename(input);
      expect(result).not.toMatch(/^\./);
    });

    it('should allow valid filename characters', () => {
      const input = 'my-file_2024.txt';
      const result = sanitizeFilename(input);
      expect(result).toBe('my-file_2024.txt');
    });
  });

  // ====================================================================
  // sanitizeObject Tests
  // ====================================================================
  
  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        email: 'JOHN@EXAMPLE.COM',
        phone: '(050) 123-4567',
      };

      const result = sanitizeObject(input);

      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toMatch(/^[\d\s\-\+\(\)]+$/);
    });

    it('should keep numbers and booleans', () => {
      const input = {
        age: 25,
        active: true,
        score: 99.5,
      };

      const result = sanitizeObject(input);

      expect(result.age).toBe(25);
      expect(result.active).toBe(true);
      expect(result.score).toBe(99.5);
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>XSS</script>Ahmad',
          details: {
            email: 'AHMAD@TEST.COM',
          },
        },
      };

      const result = sanitizeObject(input);

      expect(result.user.name).toBe('Ahmad');
      expect(result.user.details.email).toBe('ahmad@test.com');
    });

    it('should handle arrays', () => {
      const input = {
        items: [
          '<script>alert(1)</script>Item 1',
          '<b>Item 2</b>',
        ],
      };

      const result = sanitizeObject(input);

      expect(result.items[0]).not.toContain('<script>');
      expect(result.items[1]).not.toContain('<b>');
    });

    it('should filter allowed fields only', () => {
      const input = {
        name: 'John',
        email: 'john@test.com',
        password: 'secret123',
        admin: true,
      };

      const result = sanitizeObject(input, {
        allowedFields: ['name', 'email'],
      });

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('admin');
    });
  });

  // ====================================================================
  // detectXSS Tests
  // ====================================================================
  
  describe('detectXSS', () => {
    it('should detect script tags', () => {
      const input = '<script>alert(1)</script>';
      expect(detectXSS(input)).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      expect(detectXSS(input)).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(detectXSS('onclick=alert(1)')).toBe(true);
      expect(detectXSS('onload=alert(1)')).toBe(true);
      expect(detectXSS('onerror=alert(1)')).toBe(true);
    });

    it('should detect iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      expect(detectXSS(input)).toBe(true);
    });

    it('should detect object tags', () => {
      const input = '<object data="evil.swf"></object>';
      expect(detectXSS(input)).toBe(true);
    });

    it('should detect eval function', () => {
      const input = 'eval("alert(1)")';
      expect(detectXSS(input)).toBe(true);
    });

    it('should not detect safe content', () => {
      const input = 'Hello World, this is safe!';
      expect(detectXSS(input)).toBe(false);
    });
  });

  // ====================================================================
  // detectSQLInjection Tests
  // ====================================================================
  
  describe('detectSQLInjection', () => {
    it('should detect UNION attacks', () => {
      const input = "' UNION SELECT * FROM users--";
      expect(detectSQLInjection(input)).toBe(true);
    });

    it('should detect SELECT statements', () => {
      const input = "1' OR '1'='1";
      expect(detectSQLInjection(input)).toBe(true);
    });

    it('should detect SQL comments', () => {
      expect(detectSQLInjection('value--')).toBe(true);
      expect(detectSQLInjection('value/*comment*/')).toBe(true);
    });

    it('should detect OR conditions', () => {
      const input = "admin' OR 1=1--";
      expect(detectSQLInjection(input)).toBe(true);
    });

    it('should not detect safe content', () => {
      const input = 'John Smith, age 25';
      expect(detectSQLInjection(input)).toBe(false);
    });
  });

  // ====================================================================
  // detectPathTraversal Tests
  // ====================================================================
  
  describe('detectPathTraversal', () => {
    it('should detect ../ patterns', () => {
      const input = '../../../etc/passwd';
      expect(detectPathTraversal(input)).toBe(true);
    });

    it('should detect ..\\ patterns', () => {
      const input = '..\\..\\windows\\system32';
      expect(detectPathTraversal(input)).toBe(true);
    });

    it('should detect /etc/ paths', () => {
      const input = '/etc/passwd';
      expect(detectPathTraversal(input)).toBe(true);
    });

    it('should detect /windows/ paths', () => {
      const input = 'C:\\windows\\system32';
      expect(detectPathTraversal(input)).toBe(true);
    });

    it('should not detect safe paths', () => {
      const input = 'documents/file.txt';
      expect(detectPathTraversal(input)).toBe(false);
    });
  });

  // ====================================================================
  // securityCheck Tests
  // ====================================================================
  
  describe('securityCheck', () => {
    it('should detect multiple threats', () => {
      const input = '<script>alert(1)</script> OR 1=1-- ../../../';
      const result = securityCheck(input);

      expect(result.safe).toBe(false);
      expect(result.threats).toContain('XSS');
      expect(result.threats).toContain('SQL Injection');
      expect(result.threats).toContain('Path Traversal');
    });

    it('should pass safe content', () => {
      const input = 'This is perfectly safe content!';
      const result = securityCheck(input);

      expect(result.safe).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it('should detect XSS only', () => {
      const input = '<script>alert(1)</script>';
      const result = securityCheck(input);

      expect(result.safe).toBe(false);
      expect(result.threats).toContain('XSS');
      expect(result.threats).not.toContain('SQL Injection');
    });

    it('should detect SQL Injection only', () => {
      const input = "' OR '1'='1";
      const result = securityCheck(input);

      expect(result.safe).toBe(false);
      expect(result.threats).toContain('SQL Injection');
      expect(result.threats).not.toContain('XSS');
    });
  });
});
