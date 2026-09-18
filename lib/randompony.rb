# * randompony.rb
# * By Heart candy
# * Sc ini open source
# * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.


require 'open-uri'
require 'json'
require 'fileutils'

def fetch_pony
  url = https://derpibooru.org/api/v1/json/search/images?q=safe,mlp&sf=random&per_page=1
  headers = { "User-Agent" => "Mozilla/5.0", read_timeout: 10 }

  response = URI.open(url, headers).read
  data = JSON.parse(response)

  if data && data['images'] && !data['images'].empty?
    img_url = data['images'][0]['view_url']
    img_data = URI.open(img_url, headers).read

    dir = './database/temp'
    FileUtils.mkdir_p(dir) unless File.directory?(dir)

    File.open("#{dir}/pony.jpg", 'wb') do |file|
      file.write(img_data)
    end

    puts "SUCCESS"
  else
    puts "FAILED"
  end
rescue => e
  puts "ERROR: #{e.message}"
end

fetch_pony if __FILE__ == $0
