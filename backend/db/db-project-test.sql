CREATE DATABASE sekolah_db;

USE sekolah_db;

CREATE TABLE siswa (
	id INT auto_increment primary key,
    nama varchar(100) not null,
    email varchar(100) not null unique,
    kelas varchar(50) not null,
    tanggal_daftar timestamp default current_timestamp
);

-- INSERT siswa values ();
DELIMITER //

CREATE PROCEDURE ins_siswa (
	in_nama varchar(100),
    in_email varchar(100),
    in_kelas varchar(50)
)
BEGIN
	INSERT INTO siswa (nama, email, kelas) 
    VALUES (in_nama, in_email, in_kelas);
END//

DELIMITER ;



INSERT INTO siswa (nama, email, kelas) VALUES
('Ahmad Fauzi', 'ahmad.fauzi@email.com', '10 IPA 1'),
('Siti Nurhaliza', 'siti.nurhaliza@email.com', '10 IPA 2'),
('Budi Santoso', 'budi.santoso@email.com', '10 IPS 1'),
('Dewi Lestari', 'dewi.lestari@email.com', '11 IPA 1'),
('Rizky Pratama', 'rizky.pratama@email.com', '11 IPS 2'),
('Nabila Putri', 'nabila.putri@email.com', '11 IPA 3'),
('Doni Setiawan', 'doni.setiawan@email.com', '12 IPS 1'),
('Rina Wijaya', 'rina.wijaya@email.com', '12 IPA 2'),
('Fajar Nugraha', 'fajar.nugraha@email.com', '12 IPS 3'),
('Intan Permata', 'intan.permata@email.com', '10 IPS 2');
