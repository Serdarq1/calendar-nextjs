import React from 'react'
import createClient from '@/utils/supabase/server';

export default async function Notes(){
    const supabase = await createClient();
    const { data: text } = await supabase.from("test").select();

    return <pre>{JSON.stringify(text, null, 2)}</pre>
};