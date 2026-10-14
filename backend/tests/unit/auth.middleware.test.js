import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import {
  verifyToken,
  requireAdmin,
  requireManager,
  optionalAuth
} from "../../src/middlewares/auth.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey123";

describe("Auth Middleware Unit Tests", () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  describe("verifyToken", () => {
    test("should return 401 when no token is provided in headers or cookies", () => {
      verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Access denied. No token provided."
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("should return 401 when token is invalid", () => {
      mockReq.headers.authorization = "Bearer invalid.jwt.token";

      verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid or expired token."
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("should decode valid Bearer token, attach req.user, and call next()", () => {
      const payload = { id: "user123", email: "admin@onesoft.com", role: "admin" };
      const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      mockReq.headers.authorization = `Bearer ${validToken}`;

      verifyToken(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.email).toBe("admin@onesoft.com");
      expect(mockReq.user.role).toBe("admin");
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test("should authenticate via cookie refreshToken when Authorization header is missing", () => {
      const payload = { id: "user456", email: "manager@onesoft.com", role: "manager" };
      const validToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      mockReq.cookies.refreshToken = validToken;

      verifyToken(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.email).toBe("manager@onesoft.com");
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    test("should call next() if req.user has admin role", () => {
      mockReq.user = { role: "admin" };

      requireAdmin(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test("should call next() if req.user has engineer role", () => {
      mockReq.user = { role: "engineer" };

      requireAdmin(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    test("should return 403 Forbidden if user is a manager", () => {
      mockReq.user = { role: "manager" };

      requireAdmin(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Forbidden. Administrative privileges required to perform this action."
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test("should return 403 Forbidden if req.user is undefined", () => {
      requireAdmin(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("requireManager", () => {
    test("should call next() if req.user has manager role", () => {
      mockReq.user = { role: "manager" };

      requireManager(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test("should call next() if req.user has admin role (admin privilege inheritance)", () => {
      mockReq.user = { role: "admin" };

      requireManager(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    test("should return 403 Forbidden if user is an agent", () => {
      mockReq.user = { role: "agent" };

      requireManager(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Forbidden. Manager or Administrative privileges required."
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("optionalAuth", () => {
    test("should attach req.user when valid token is provided", () => {
      const payload = { id: "user789", role: "admin" };
      const validToken = jwt.sign(payload, JWT_SECRET);

      mockReq.headers.authorization = `Bearer ${validToken}`;

      optionalAuth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe("user789");
      expect(nextFunction).toHaveBeenCalled();
    });

    test("should still call next() without error if token is missing", () => {
      optionalAuth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    test("should still call next() without error if token is invalid", () => {
      mockReq.headers.authorization = "Bearer corrupted-token";

      optionalAuth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
