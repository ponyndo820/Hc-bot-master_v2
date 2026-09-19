# * ssweb.rb
# * By Heart candy
# * Sc ini open source
# * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.

require 'open-uri'

url = ARGV[0]
nama_file = ARGV[1] || "web_screenshot.png"
mode = ARGV[2] || "desktop"

if url.nil? || url.empty?
  puts "[X] URL tidak boleh kosong!"
  exit
end

if mode == "mobile"
  api_url = "https://image.thum.io/get/iphone/#{url}"
else
  api_url = "https://image.thum.io/get/width/1280/crop/800/#{url}"
end

begin
  URI.open(api_url, "User-Agent" => "Mozilla/5.0") { |f| f.read }
  
  sleep(15)
  
  URI.open(api_url, "User-Agent" => "Mozilla/5.0") do |gambar|
    File.open(nama_file, "wb") do |file|
      file.write(gambar.read)
    end
  end
  
  puts "[✓] Screenshot berhasil disimpan ke #{nama_file}"
rescue => e
  puts "[X] Gagal mengambil screenshot: #{e.message}"
  exit 1
end
