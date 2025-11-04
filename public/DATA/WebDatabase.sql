Create database WebDB
GO
Use WebDB
GO

-- Ngắt kết nối để drop database
USE master;
ALTER DATABASE WebDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE WebDB;

CREATE TABLE Account (
	AccountId		INT IDENTITY(1,1) PRIMARY KEY,
	Username		NVARCHAR(100)   ,
	Email			NVARCHAR(100) NOT NULL UNIQUE,
	Phone			NVARCHAR(50) NOT NULL UNIQUE,
	PasswordHash	NVARCHAR(255) NOT NULL,
	Role			NVARCHAR(20) NOT NULL,
    State           NVARCHAR(20) NOT NULL DEFAULT('Active'),
    ImageUrl        NVARCHAR(1000) NULL,
    CreatedAt       DATETIME2 DEFAULT SYSUTCDATETIME(),
	CONSTRAINT CHK_Account_Role CHECK (Role IN ('Customer','Seller','Shipper','Admin'))
);
Drop Table Account

CREATE TABLE CustomerProfile (
    CustomerId  INT PRIMARY KEY,
    FullName    NVARCHAR(200) NULL,
    Address     NVARCHAR(500) NULL,
    Birthday    DATE NULL,
    Gender      NVARCHAR(10) NULL,
	Balance		DECIMAL(18,2) NOT NULL DEFAULT(0),	-- Tiền đã chi mua hàng
    CONSTRAINT FK_CustomerProfile_Account FOREIGN KEY (CustomerId) 
        REFERENCES Account(AccountId) ON DELETE CASCADE
);

DROP Table CustomerProfile

CREATE TABLE SellerProfile (
    SellerId     INT PRIMARY KEY,
    FullName     NVARCHAR(200) NULL,
    Address      NVARCHAR(500) NULL,
    Birthday     DATE NULL,
    Gender       NVARCHAR(10) NULL,
    StoreName    NVARCHAR(200) NOT NULL,
    StoreAddress NVARCHAR(500) NULL,
    Balance      DECIMAL(18,2) NOT NULL DEFAULT(0),	-- Tiền thu được khi bán
    CONSTRAINT FK_SellerProfile_Account FOREIGN KEY (SellerId) 
        REFERENCES Account(AccountId) ON DELETE CASCADE
);

DROP Table SellerProfile

CREATE TABLE ShipperProfile (
    ShipperId   INT PRIMARY KEY,
    FullName    NVARCHAR(200) NULL,
    Address     NVARCHAR(500) NULL,
    Birthday    DATE NULL,
    Gender      NVARCHAR(10) NULL,
    VehicleInfo NVARCHAR(200) NULL,   -- Xe máy/ô tô/xe tải
    LicenseNo   NVARCHAR(100) NULL,   -- Biển số
    Region      NVARCHAR(200) NULL,   -- Khu vực giao hàng
    Balance     DECIMAL(18,2) NOT NULL DEFAULT(0), -- Tiền shipper nhận
    CONSTRAINT FK_ShipperProfile_Account FOREIGN KEY (ShipperId) 
        REFERENCES Account(AccountId) ON DELETE CASCADE
);
DROP Table ShipperProfile

CREATE TABLE AdminProfile (
    AdminId     INT PRIMARY KEY,
    FullName    NVARCHAR(200) NULL,
    Birthday    DATE NULL,
    Gender      NVARCHAR(10) NULL,
    Position    NVARCHAR(100) NULL,  -- Ví dụ: Quản lý hệ thống
    Note        NVARCHAR(MAX) NULL,
    CONSTRAINT FK_AdminProfile_Account FOREIGN KEY (AdminId) 
        REFERENCES Account(AccountId) ON DELETE CASCADE
);
DROP Table AdminProfile

CREATE TABLE Product (
    ProductId    INT IDENTITY(1,1) PRIMARY KEY,
    SellerId     INT NOT NULL,
    NameProduct  NVARCHAR(255) NOT NULL,
    Category     NVARCHAR(100) NOT NULL,
    Quantity     INT NOT NULL DEFAULT 0,
    Price        DECIMAL(18,2) NOT NULL DEFAULT(0),
    Description  NVARCHAR(MAX) NULL,
    Warranty     NVARCHAR(200) NULL,
    ImageUrl     NVARCHAR(1000) NOT NULL,
    TagName      NVARCHAR(200) NOT NULL,
    Brand NVARCHAR(100) NOT NULL DEFAULT('Unknown'),
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Product_Seller FOREIGN KEY (SellerId) 
        REFERENCES SellerProfile(SellerId) ON DELETE CASCADE
);
DROP Table Product

CREATE TABLE Review (
    ReviewId     INT IDENTITY(1,1) PRIMARY KEY,
    ProductId    INT NOT NULL,
    CustomerId   INT NOT NULL, -- Chỉ Customer mới review
    Rating       TINYINT CHECK (Rating BETWEEN 1 AND 5),
    Comment      NVARCHAR(MAX) NULL,
    CreatedAt    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Review_Product FOREIGN KEY (ProductId) REFERENCES Product(ProductId) ON DELETE CASCADE,
    CONSTRAINT FK_Review_Customer FOREIGN KEY (CustomerId) REFERENCES CustomerProfile(CustomerId) ON DELETE NO ACTION
);
DROP Table Review

CREATE TABLE Basket (
    BasketId     INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId   INT NOT NULL,
    ProductId    INT NOT NULL,
    Quantity     INT NOT NULL DEFAULT(1),
    UnitPrice    DECIMAL(18,2) NOT NULL,
    AddedAt      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Basket_Customer FOREIGN KEY (CustomerId) REFERENCES CustomerProfile(CustomerId) ON DELETE CASCADE,
    CONSTRAINT FK_Basket_Product FOREIGN KEY (ProductId) REFERENCES Product(ProductId) ON DELETE NO ACTION
);
DROP Table Basket

CREATE TABLE OrderProduct (
    OrderId      INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId   INT NOT NULL,
    ShipperId    INT NULL,
    VoucherId    INT NULL,
    OrderDate    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ShipAddress  NVARCHAR(500) NULL,
    ShipPhone    NVARCHAR(50) NULL,
    SubTotal     DECIMAL(18,2) NOT NULL DEFAULT(0),
    DiscountAmt  DECIMAL(18,2) NOT NULL DEFAULT(0),
    ShippingFee  DECIMAL(18,2) NOT NULL DEFAULT(0),
    TotalAmount  DECIMAL(18,2) NOT NULL DEFAULT(0),
    State        NVARCHAR(30) NOT NULL DEFAULT('Pending'),
    ApprovedAt   DATETIME2 NULL,
    ShippedAt    DATETIME2 NULL,
    DeliveredAt  DATETIME2 NULL,
    UpdatedAt    DATETIME2 NULL,
    CONSTRAINT FK_Order_Customer FOREIGN KEY (CustomerId) REFERENCES CustomerProfile(CustomerId) ON DELETE CASCADE,
    CONSTRAINT FK_Order_Shipper FOREIGN KEY (ShipperId) REFERENCES ShipperProfile(ShipperId),
    CONSTRAINT CHK_Order_State CHECK (State IN ('Pending','Approved','Shipped','Delivered','Cancelled'))
);
DROP Table OrderProduct

CREATE TABLE OrderItem (
    OrderItemId  INT IDENTITY(1,1) PRIMARY KEY,
    OrderId      INT NOT NULL,
    ProductId    INT NOT NULL,
    SellerId     INT NOT NULL,
    Quantity     INT NOT NULL DEFAULT(1),
    UnitPrice    DECIMAL(18,2) NOT NULL,
    LineTotal    DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_OrderItem_Order FOREIGN KEY (OrderId) REFERENCES OrderProduct (OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItem_Product FOREIGN KEY (ProductId) REFERENCES Product(ProductId),
    CONSTRAINT FK_OrderItem_Seller FOREIGN KEY (SellerId) REFERENCES SellerProfile(SellerId)
);
Drop Table OrderItem

CREATE TABLE Voucher (
    VoucherId    INT IDENTITY(1,1) PRIMARY KEY,   
    Code         NVARCHAR(100) NOT NULL UNIQUE,   -- Mã voucher (VD: SALE10, FREESHIP)
    CreatedBySeller INT NULL,                     
    CreatedByAdmin  INT NULL,                     
    CustomerId   INT NULL,                        
    DiscountType NVARCHAR(20) NOT NULL DEFAULT('Percent'), -- Kiểu giảm: 'Percent' hoặc 'Fixed'
    DiscountVal  DECIMAL(18,2) NOT NULL,          -- Giá trị giảm: % hoặc số tiền cụ thể
    MinOrderAmt  DECIMAL(18,2) NULL,              -- Giá trị đơn hàng tối thiểu để áp dụng
    ValidFrom    DATETIME2 NULL,                  -- Ngày bắt đầu có hiệu lực
    ValidTo      DATETIME2 NULL,                  -- Ngày hết hạn
    IsActive     BIT NOT NULL DEFAULT(1),         -- Voucher còn hoạt động hay không
	CONSTRAINT FK_Voucher_Seller FOREIGN KEY (CreatedBySeller) REFERENCES SellerProfile(SellerId) ON DELETE CASCADE,
    CONSTRAINT FK_Voucher_Admin FOREIGN KEY (CreatedByAdmin) REFERENCES AdminProfile(AdminId) ,
    CONSTRAINT FK_Voucher_Customer FOREIGN KEY (CustomerId) REFERENCES CustomerProfile(CustomerId)
);
Drop Table Voucher


-- Bảng trung gian để biết Customer có dùng voucher đó chưa
CREATE TABLE VoucherUsage (
    UsageId     INT IDENTITY(1,1) PRIMARY KEY,
    VoucherId   INT NOT NULL,
    CustomerId  INT NOT NULL,
    OrderId     INT NULL,             -- đơn hàng mà voucher được áp dụng
    UsedDate    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_VoucherUsage_Voucher FOREIGN KEY (VoucherId) REFERENCES Voucher(VoucherId) ON DELETE CASCADE,
    CONSTRAINT FK_VoucherUsage_Customer FOREIGN KEY (CustomerId) REFERENCES CustomerProfile(CustomerId) ON DELETE NO ACTION,

    -- 🔒 Mỗi khách hàng chỉ được dùng 1 lần / 1 voucher
    CONSTRAINT UQ_VoucherUsage UNIQUE (VoucherId, CustomerId)
);


-- Example data for testing
SELECT * FROM Account
DBCC CHECKIDENT ('Account', RESEED, 0);
DELETE FROM Account

SELECT * FROM Product
DBCC CHECKIDENT ('Product', RESEED, 0);
Delete From Product

SELECT * FROM Review
WHERE ProductId = 14
DBCC CHECKIDENT ('Review', RESEED, 0);
Delete From Review

SELECT * FROM Basket
DBCC CHECKIDENT ('Basket', RESEED, 0);
Delete From Basket

SELECT * FROM OrderProduct
WHERE State = 'Shipped'
DBCC CHECKIDENT ('OrderProduct', RESEED, 0);
Delete From OrderProduct

SELECT * FROM OrderItem
DBCC CHECKIDENT ('OrderItem', RESEED, 0);
Delete From OrderItem

SELECT * FROM Voucher
DBCC CHECKIDENT ('Voucher', RESEED, 0);
Delete From Voucher
